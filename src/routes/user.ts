import { Router } from "express";
import { getAllUsers, getMe, deleteUser } from "../apis/user";
import { admin, protect, validate } from "../middleware/auth";

const userRouter = Router();

// get all users
userRouter.get("/all", protect, getAllUsers);

// get current user
userRouter.get("/me", protect, getMe);

// delete current user
userRouter.delete("/delete/:email", admin, deleteUser);

export default userRouter;
