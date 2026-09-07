import db from "../models/index.js";

const { session: Session, user: User, list: List, todo: Todo } = db;

const getBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const authenticate = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  try {
    const sessionRow = await Session.findOne({
      where: { token },
      include: [{ model: User, as: "user" }],
    });

    if (!sessionRow || !sessionRow.user || new Date(sessionRow.expirationDate) < new Date()) {
      return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
    }

    req.user = {
      id: sessionRow.user.id,
      role: sessionRow.user.role,
    };

    req.sessionToken = token;
    return next();
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }
};

export const getAccessibleListOrNull = async (req, listId) => {
  const row = await List.findOne({ where: { id: listId, userId: req.user.id } });
  return row ?? null;
};

export const getAccessibleTodoOrNull = async (req, todoId) => {
  const row = await Todo.findOne({ where: { id: todoId, userId: req.user.id } });
  return row ?? null;
};

export const getAccessibleUserOrNull = async (req, userId) => {
  const id = parseInt(userId, 10);

  if (Number.isNaN(id) || id !== req.user.id) {
    return null;
  }

  const row = await User.findByPk(id);
  return row ?? null;
};
