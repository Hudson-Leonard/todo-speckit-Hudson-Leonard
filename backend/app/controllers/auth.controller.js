import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const { user: User, session: Session } = db;
const SALT_ROUNDS = 10;
const SESSION_MS = 24 * 60 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimOrEmpty = (value) => (typeof value === "string" ? value.trim() : "");

const toAuthPayload = (user, token) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

const issueSession = async (user) => {
  const existing = await Session.findOne({
    where: {
      userId: user.id,
      expirationDate: { [Op.gt]: new Date() },
    },
  });

  if (existing?.token) {
    return existing.token;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });
  await Session.create({
    token,
    email: user.email,
    userId: user.id,
    expirationDate: new Date(Date.now() + SESSION_MS),
  });

  return token;
};

const exports = {};

exports.register = async (req, res) => {
  const fName = trimOrEmpty(req.body.fName);
  const lName = trimOrEmpty(req.body.lName);
  const email = trimOrEmpty(req.body.email);
  const username = trimOrEmpty(req.body.username).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!fName) {
    return res.status(400).send({ message: "First name is required." });
  }
  if (!lName) {
    return res.status(400).send({ message: "Last name is required." });
  }
  if (!email) {
    return res.status(400).send({ message: "Email is required." });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).send({ message: "Enter a valid email address." });
  }
  if (!username) {
    return res.status(400).send({ message: "Username is required." });
  }
  if (!password) {
    return res.status(400).send({ message: "Password is required." });
  }
  if (password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  try {
    const duplicateUsername = await User.unscoped().findOne({ where: { username } });
    if (duplicateUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const duplicateEmail = await User.unscoped().findOne({ where: { email } });
    if (duplicateEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      fName,
      lName,
      email,
      username,
      password: hashed,
      role: "worker",
    });

    const token = await issueSession(user);
    return res.status(201).send(toAuthPayload(user, token));
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: "Registration failed." });
  }
};

exports.login = async (req, res) => {
  const username = trimOrEmpty(req.body.username).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!username) {
    return res.status(400).send({ message: "Username is required." });
  }
  if (!password) {
    return res.status(400).send({ message: "Password is required." });
  }

  try {
    const user = await User.unscoped().findOne({ where: { username } });
    const passwordOk = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordOk) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const token = await issueSession(user);
    return res.status(200).send(toAuthPayload(user, token));
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: "Login failed." });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.sessionToken) {
      await Session.update({ token: "" }, { where: { token: req.sessionToken } });
    }
    return res.status(200).send({ message: "Signed out." });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: "Logout failed." });
  }
};

export default exports;
