import { Router } from "express";
import UserController from "../controllers/user.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/:id", [authenticate], UserController.findOne);
router.put("/:id", [authenticate], UserController.update);

export default router;
