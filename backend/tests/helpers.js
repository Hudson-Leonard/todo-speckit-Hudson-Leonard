import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";

export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const closeTestDatabase = async () => {
  await db.sequelize.close();
};

export const validRegisterBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  password: "password1",
  ...overrides,
});

export const registerUser = (overrides = {}) =>
  request(app).post("/todo/register").send(validRegisterBody(overrides));

export const loginUser = (username, password) =>
  request(app).post("/todo/login").send({ username, password });

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const passwordIsHashed = async (userId, plain) => {
  const user = await db.user.unscoped().findByPk(userId);
  if (!user) {
    return false;
  }
  return bcrypt.compare(plain, user.password);
};
