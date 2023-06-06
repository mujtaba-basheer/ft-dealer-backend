import { Router } from "express";
import { addUser } from "../apis/user";
import { checkAdmin } from "../middleware/auth";

const userRouter = Router();

// add a new user
userRouter.post("/add", checkAdmin, addUser);

export default userRouter;
