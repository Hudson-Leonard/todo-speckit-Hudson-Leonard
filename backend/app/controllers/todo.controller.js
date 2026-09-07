import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";
import db from "../models/index.js";

const { todo: Todo } = db;

const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const normalizeTitle = (value) => (typeof value === "string" ? value.trim() : "");

const titleError = (title) => {
  if (!title) {
    return "Todo title is required.";
  }
  if (title.length > 255) {
    return "Todo title must be 255 characters or fewer.";
  }
  return null;
};

const listNotFound = (id) => ({ message: `List with id=${id} not found.` });
const todoNotFound = (id) => ({ message: `Todo with id=${id} not found.` });

const todoOrder = [
  ["completed", "ASC"],
  ["createdAt", "ASC"],
];

const exports = {};

exports.findAllForList = async (req, res) => {
  const listId = parseId(req.params.listId);

  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send(listNotFound(listId));
    }

    const todos = await Todo.findAll({
      where: { listId, userId: req.user.id },
      order: todoOrder,
    });
    return res.send(todos);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

exports.createForList = async (req, res) => {
  const listId = parseId(req.params.listId);

  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  const title = normalizeTitle(req.body.title);
  const invalid = titleError(title);

  if (invalid) {
    return res.status(400).send({ message: invalid });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send(listNotFound(listId));
    }

    const todo = await Todo.create({
      title,
      listId: list.id,
      userId: req.user.id,
      completed: false,
    });
    return res.status(201).send(todo);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  const todoId = parseId(req.params.id);

  if (todoId === null) {
    return res.status(400).send({ message: "Invalid todo id." });
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, todoId);

    if (!todo) {
      return res.status(404).send(todoNotFound(todoId));
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const title = normalizeTitle(req.body.title);
      const invalid = titleError(title);

      if (invalid) {
        return res.status(400).send({ message: invalid });
      }

      todo.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      todo.completed = Boolean(req.body.completed);
    }

    await todo.save();
    return res.send(todo);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  const todoId = parseId(req.params.id);

  if (todoId === null) {
    return res.status(400).send({ message: "Invalid todo id." });
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, todoId);

    if (!todo) {
      return res.status(404).send(todoNotFound(todoId));
    }

    await todo.destroy();
    return res.status(200).send({ message: "Todo was deleted successfully." });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export default exports;
