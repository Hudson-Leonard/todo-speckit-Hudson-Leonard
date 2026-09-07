import { Router } from "express";
import TodoController from "../controllers/todo.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router({ mergeParams: true });

router.get("/", [authenticate], TodoController.findAllForList);
router.post("/", [authenticate], TodoController.createForList);

export default router;
