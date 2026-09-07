import { Router } from "express";
import ListController from "../controllers/list.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], ListController.findAll);
router.post("/", [authenticate], ListController.create);
router.put("/:listId", [authenticate], ListController.update);
router.delete("/:listId", [authenticate], ListController.delete);

export default router;
