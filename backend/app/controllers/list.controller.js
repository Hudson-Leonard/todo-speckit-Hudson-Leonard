import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";
import db from "../models/index.js";

const { list: List } = db;

const parseListId = (value) => {
  const listId = parseInt(value, 10);
  return Number.isNaN(listId) ? null : listId;
};

const normalizeName = (value) => (typeof value === "string" ? value.trim() : "");

const nameError = (name) => {
  if (!name) {
    return "List name is required.";
  }
  if (name.length > 100) {
    return "List name must be 100 characters or fewer.";
  }
  return null;
};

const notFound = (id) => ({ message: `List with id=${id} not found.` });

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const lists = await List.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    res.send(lists);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: err.message });
  }
};

exports.create = async (req, res) => {
  const name = normalizeName(req.body.name);
  const invalid = nameError(name);

  if (invalid) {
    return res.status(400).send({ message: invalid });
  }

  try {
    const list = await List.create({
      name,
      userId: req.user.id,
    });
    return res.status(201).send(list);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  const listId = parseListId(req.params.listId);

  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  const name = normalizeName(req.body.name);
  const invalid = nameError(name);

  if (invalid) {
    return res.status(400).send({ message: invalid });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send(notFound(listId));
    }

    list.name = name;
    await list.save();
    return res.send(list);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  const listId = parseListId(req.params.listId);

  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send(notFound(listId));
    }

    await db.todo.destroy({ where: { listId: list.id } });
    await list.destroy();
    return res.status(200).send({ message: "List was deleted successfully." });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export default exports;
