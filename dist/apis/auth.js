"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.googleSignup = exports.googleLogin = exports.login = void 0;
const bcryptjs_1 = require("bcryptjs");
const Joi = require("joi");
const auth_1 = require("../utils/auth");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
const dotenv_1 = require("dotenv");
const db_1 = require("../db");
const jsonwebtoken_1 = require("jsonwebtoken");
(0, dotenv_1.config)();
exports.login = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const body = req.body;
        // defining request body schema
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(50).required(),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(body);
        if (!validationError) {
            const { email, password } = body;
            db_1.default.query({
                sql: `
            SELECT
              email, password, role, name
            FROM
              users
            WHERE
              email = ?;
          `,
                values: [email],
            }, async (err, results, fields) => {
                if (err)
                    return next(new app_error_1.default(err.message, 403));
                if (results.length === 0)
                    return next(new app_error_1.default("User not found", 404));
                const user = results[0];
                if (await (0, bcryptjs_1.compare)(password, user.password)) {
                    const obj = Object.assign({}, user);
                    delete obj.password;
                    const token = (0, auth_1.signToken)(obj);
                    const cookieOptions = {
                        expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
                        path: "/",
                        sameSite: "none",
                        domain: "localhost",
                    };
                    if (process.env.NODE_ENV === "production") {
                        cookieOptions.httpOnly = true;
                        cookieOptions.domain = "ftdealer.com";
                    }
                    res.cookie("jwt", token, cookieOptions);
                    res.status(200).json({
                        status: true,
                        data: {
                            name: obj.name,
                            email: obj.email,
                        },
                        msg: "Logged In Successfully",
                    });
                }
                else
                    return next(new app_error_1.default("Incorrect email or password", 401));
            });
        }
        else {
            console.log(validationError);
            return next(new app_error_1.default(validationError.details[0].message, 400));
        }
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.googleLogin = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const body = req.body;
        // defining request body schema
        const schema = Joi.object({
            credentials: Joi.string().required(),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(body);
        if (!validationError) {
            const { credentials } = body;
            const { email } = (0, jsonwebtoken_1.decode)(credentials);
            db_1.default.query(`SELECT
            email, name
          FROM
            users
          WHERE
            email = "${email}"
          `, async (err, results, fields) => {
                if (err)
                    return next(new app_error_1.default(err.message, 403));
                if (results.length === 0)
                    return next(new app_error_1.default("No user found with this email", 404));
                const user = results[0];
                const obj = Object.assign({}, user);
                const token = (0, auth_1.signToken)(obj);
                const cookieOptions = {
                    expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
                    path: "/",
                    sameSite: "none",
                    secure: true,
                };
                if (process.env.NODE_ENV === "production") {
                    cookieOptions.httpOnly = true;
                    cookieOptions.secure = true;
                    cookieOptions.domain = "takeuforward.org";
                }
                res.cookie("jwt", token, cookieOptions);
                res.status(200).json({
                    status: true,
                    data: {
                        name: obj.name,
                        email: obj.email,
                    },
                    msg: "Logged In Successfully",
                });
            });
        }
        else {
            console.log(validationError);
            return next(new app_error_1.default("Missing or invalid parameters", 400));
        }
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.googleSignup = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const body = req.body;
        // defining request body schema
        const schema = Joi.object({
            credentials: Joi.string().required(),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(body);
        if (!validationError) {
            const { credentials } = body;
            const { email, name } = (0, jsonwebtoken_1.decode)(credentials);
            // adding user data to db
            db_1.default.query(`INSERT INTO
          users (
            name,
            email
          ) VALUES (
            "${name}",
            "${email}"
          );`, (err, results, fields) => {
                if (err) {
                    console.error(err);
                    return next(new app_error_1.default(err.errno === 1062
                        ? `User with email '${email}' already exists!`
                        : err.message, 403));
                }
                const token = (0, auth_1.signToken)({ name, email });
                const cookieOptions = {
                    expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
                    path: "/",
                    sameSite: "none",
                    secure: true,
                };
                if (process.env.NODE_ENV === "production") {
                    cookieOptions.httpOnly = true;
                    cookieOptions.secure = true;
                    cookieOptions.domain = "takeuforward.org";
                }
                res.cookie("jwt", token, cookieOptions);
                // sending response
                res.status(200).json({
                    status: true,
                    data: {
                        name,
                        email,
                    },
                    msg: "Account Created Successfully",
                });
            });
        }
        else {
            return next(new app_error_1.default(validationError.details[0].message, 400));
        }
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.logout = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const cookieOptions = {
            expires: new Date(Date.now()),
            path: "/",
            sameSite: "none",
            secure: true,
        };
        if (process.env.NODE_ENV === "production") {
            cookieOptions.httpOnly = true;
            cookieOptions.secure = true;
            cookieOptions.domain = "takeuforward.org";
        }
        res.clearCookie("jwt", cookieOptions);
        res.status(200).json({
            status: true,
            msg: "Logging out...",
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
