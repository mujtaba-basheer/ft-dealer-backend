import { Router } from "express";
import { login, logout, activate } from "../apis/auth";
import { protect } from "../middleware/auth";

const authRouter = Router();

// user login
authRouter.post("/login", login);

// activate user
authRouter.post("/activate", activate);

// user logout
authRouter.get("/logout", protect, logout);

export default authRouter;
