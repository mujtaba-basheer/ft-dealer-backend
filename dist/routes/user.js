"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../apis/user");
const auth_1 = require("../middleware/auth");
const userRouter = (0, express_1.Router)();
// add a new user
userRouter.post("/add", auth_1.checkAdmin, user_1.addUser);
exports.default = userRouter;
