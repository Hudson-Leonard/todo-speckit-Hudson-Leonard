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

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const INVALID_DUE_DATE = "Due date must be a valid date in YYYY-MM-DD format.";

const parseDueDate = (value) => {
  if (value === undefined) {
    return { omitted: true };
  }

  if (value === null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string" || !DATE_ONLY.test(value)) {
    return { error: INVALID_DUE_DATE };
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { error: INVALID_DUE_DATE };
  }

  return { value };
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

  const dueDateResult = parseDueDate(req.body.dueDate);

  if (dueDateResult.error) {
    return res.status(400).send({ message: dueDateResult.error });
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
      dueDate: dueDateResult.omitted ? null : dueDateResult.value,
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

    if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
      const dueDateResult = parseDueDate(req.body.dueDate);

      if (dueDateResult.error) {
        return res.status(400).send({ message: dueDateResult.error });
      }

      todo.dueDate = dueDateResult.value;
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
