import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", [authenticate], AuthController.logout);

export default router;
