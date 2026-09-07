import { Router } from "express";
import TodoController from "../controllers/todo.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.put("/:id", [authenticate], TodoController.update);
router.delete("/:id", [authenticate], TodoController.delete);

export default router;
