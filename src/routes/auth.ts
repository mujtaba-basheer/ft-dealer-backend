import { Router } from "express";
import { signup, login, logout, googleLogin, googleSignup } from "../apis/auth";
import { protect } from "../middleware/auth";

const authRouter = Router();

// user signup
authRouter.post("/signup", signup);

// user google-signup
authRouter.post("/google-signup", googleSignup);

// user login
authRouter.post("/login", login);

// user google-login
authRouter.post("/google-login", googleLogin);

// user logout
authRouter.get("/logout", protect, logout);

export default authRouter;
