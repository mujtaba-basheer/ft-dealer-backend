"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../apis/auth");
const auth_2 = require("../middleware/auth");
const authRouter = (0, express_1.Router)();
// user signup
authRouter.post("/signup", auth_1.signup);
// user google-signup
authRouter.post("/google-signup", auth_1.googleSignup);
// user login
authRouter.post("/login", auth_1.login);
// user google-login
authRouter.post("/google-login", auth_1.googleLogin);
// user logout
authRouter.get("/logout", auth_2.protect, auth_1.logout);
exports.default = authRouter;
