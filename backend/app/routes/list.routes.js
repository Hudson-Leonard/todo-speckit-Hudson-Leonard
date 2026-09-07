import { Router } from "express";
import ListController from "../controllers/list.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], ListController.findAll);

export default router;
