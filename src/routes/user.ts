import { Router } from "express";
import { addUser, deleteUser, getAllUsers, updateUser } from "../apis/user";
import { checkAdmin, protect } from "../middleware/auth";

const userRouter = Router();

// add a new user
userRouter.post("/", protect, checkAdmin, addUser);

// update a user
userRouter.put("/:email", protect, checkAdmin, updateUser);

// delete a user
userRouter.delete("/:email", protect, checkAdmin, deleteUser);

// get all users
userRouter.get("/", protect, checkAdmin, getAllUsers);

export default userRouter;
