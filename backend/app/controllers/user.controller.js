import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";
import db from "../models/index.js";

const { user: User } = db;
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimOrEmpty = (value) => (typeof value === "string" ? value.trim() : "");

const parseUserId = (value) => {
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const notFound = (id) => ({ message: `User with id=${id} not found.` });

const exports = {};

exports.findOne = async (req, res) => {
  const userId = parseUserId(req.params.id);

  if (userId === null) {
    return res.status(400).send({ message: "Invalid user id." });
  }

  try {
    const user = await getAccessibleUserOrNull(req, userId);

    if (!user) {
      return res.status(404).send(notFound(userId));
    }

    return res.send(user);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  const userId = parseUserId(req.params.id);

  if (userId === null) {
    return res.status(400).send({ message: "Invalid user id." });
  }

  const password =
    typeof req.body.password === "string" && req.body.password.length > 0 ? req.body.password : null;

  if (password !== null && password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  const fName = trimOrEmpty(req.body.fName);
  const lName = trimOrEmpty(req.body.lName);
  const email = trimOrEmpty(req.body.email);
  const username = trimOrEmpty(req.body.username).toLowerCase();

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

  try {
    const user = await getAccessibleUserOrNull(req, userId);

    if (!user) {
      return res.status(404).send(notFound(userId));
    }

    const duplicateUsername = await User.unscoped().findOne({
      where: { username, id: { [Op.ne]: user.id } },
    });
    if (duplicateUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const duplicateEmail = await User.unscoped().findOne({
      where: { email, id: { [Op.ne]: user.id } },
    });
    if (duplicateEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const scoped = await User.unscoped().findByPk(user.id);
    scoped.fName = fName;
    scoped.lName = lName;
    scoped.email = email;
    scoped.username = username;

    if (password !== null) {
      scoped.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await scoped.save();
    const updated = await User.findByPk(user.id);
    return res.send(updated);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export default exports;
