"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../apis/user");
const auth_1 = require("../middleware/auth");
const userRouter = (0, express_1.Router)();
// add a new user
userRouter.post("/", auth_1.protect, auth_1.checkAdmin, user_1.addUser);
// update a user
userRouter.put("/:email", auth_1.protect, auth_1.checkAdmin, user_1.updateUser);
// get all users
userRouter.get("/", auth_1.protect, auth_1.checkAdmin, user_1.getAllUsers);
exports.default = userRouter;
