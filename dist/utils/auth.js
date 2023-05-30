"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.createSendToken = exports.signToken = void 0;
const bcryptjs_1 = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const store = [
    {
        code_verifier: "",
        state: "",
        __ms: "",
        memberstack: "",
    },
];
// sign jwt token
const signToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};
exports.signToken = signToken;
// create send token
const createSendToken = (user, statusCode, req, res) => {
    // const token = signToken(user._id);
    // res.cookie("jwt", token, {
    //   expires: new Date(
    //     Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    //   ),
    //   httpOnly: true,
    //   secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    // });
    // // Remove password from output
    // user.password = undefined;
    // res.json({
    //   status: "success",
    //   token,
    //   data: {
    //     user,
    //   },
    // });
};
exports.createSendToken = createSendToken;
const comparePassword = (storedPass, enteredPass) => {
    return (0, bcryptjs_1.compare)(storedPass, enteredPass);
};
exports.comparePassword = comparePassword;
