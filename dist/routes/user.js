"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../apis/user");
const auth_1 = require("../middleware/auth");
const userRouter = (0, express_1.Router)();
// get all users
userRouter.get("/all", auth_1.protect, user_1.getAllUsers);
// get current user
userRouter.get("/me", auth_1.protect, user_1.getMe);
// delete current user
userRouter.delete("/delete/:email", auth_1.admin, user_1.deleteUser);
exports.default = userRouter;
