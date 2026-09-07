import logger from "../config/logger.js";

const exports = {};

exports.findAll = async (_req, res) => {
  try {
    // List rows are Feature 2; Feature 1 only needs a protected, user-scoped GET.
    res.send([]);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: err.message });
  }
};

export default exports;
