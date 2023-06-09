import { Router } from "express";
import {
  addUser,
  deleteUser,
  getAllUsers,
  getMe,
  updateUser,
} from "../apis/user";
import { checkAdmin, protect } from "../middleware/auth";

const userRouter = Router();

// add a new user
userRouter.post("/", protect, checkAdmin, addUser);

// update a user
userRouter.put("/:email", protect, checkAdmin, updateUser);

// delete a user
userRouter.delete("/:email", protect, checkAdmin, deleteUser);

// get authenticated user
userRouter.get("/me", protect, getMe);

// get all users
userRouter.get("/", protect, checkAdmin, getAllUsers);

export default userRouter;
