import { Router } from "express";
import { login, logout } from "../apis/auth";
import { protect } from "../middleware/auth";

const authRouter = Router();

// user login
authRouter.post("/login", login);

// user logout
authRouter.get("/logout", protect, logout);

export default authRouter;
