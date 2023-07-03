"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.activate = exports.login = void 0;
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
            const fetchUserQuery = `
        SELECT
          email,
          password,
          role,
          fname
        FROM
          users
        WHERE
          email = ?;
        `;
            db_1.default.query({
                sql: fetchUserQuery,
                values: [email],
            }, async (err, results, fields) => {
                if (err) {
                    console.error(err);
                    return next(new app_error_1.default(err.message, 400));
                }
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
                        cookieOptions.domain = process.env.COOKIE_DOMAIN;
                        cookieOptions.secure = true;
                    }
                    res.cookie("jwt", token, cookieOptions);
                    res.status(200).json({
                        status: true,
                        data: {
                            name: obj.fname,
                            email: obj.email,
                            role: obj.role,
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
        console.error(error);
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.activate = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const body = req.body;
        // defining request body schema
        const schema = Joi.object({
            name: Joi.string().required(),
            password: Joi.string().min(8).max(50).required(),
            auth_token: Joi.string().required(),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(body);
        if (!validationError) {
            const { name, auth_token, password } = body;
            let [fname, ...rem] = name.split(" ");
            let lname = rem.join(" ");
            (0, jsonwebtoken_1.verify)(auth_token, process.env.JWT_SECRET, (err, decoded) => {
                if (err)
                    return next(new app_error_1.default(err.message, 401));
                const { email } = decoded;
                db_1.default.query({
                    sql: `
            SELECT
              email, fname, role
            FROM
              users
            WHERE
              email = ?
              AND status = "inactive";
          `,
                    values: [email],
                }, async (err, results, fields) => {
                    if (err)
                        return next(new app_error_1.default(err.message, 403));
                    if (results.length === 0)
                        return next(new app_error_1.default("User not found", 404));
                    // hashing password for security purpose
                    const hashedPassword = await (0, bcryptjs_1.hash)(password, 12);
                    const user = results[0];
                    const activateUserQuery = `
              UPDATE
                users
              SET
                password = "${hashedPassword}",
                status = "active",
                fname = ?,
                lname = ?
              WHERE
                email = ?;
              `;
                    db_1.default.query({
                        sql: activateUserQuery,
                        values: [fname, lname, email],
                    }, (err, results) => {
                        if (err)
                            return next(new app_error_1.default(err.message, 403));
                        const token = (0, auth_1.signToken)({
                            email,
                            name: user.fname,
                            role: user.role,
                        });
                        const cookieOptions = {
                            expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
                            path: "/",
                            sameSite: "none",
                            domain: "localhost",
                        };
                        if (process.env.NODE_ENV === "production") {
                            cookieOptions.httpOnly = true;
                            cookieOptions.domain = process.env.COOKIE_DOMAIN;
                            cookieOptions.secure = true;
                        }
                        res.cookie("jwt", token, cookieOptions);
                        // sending response
                        res.status(200).json({
                            status: true,
                            data: {
                                name: user.fname,
                                email: user.email,
                                role: user.role,
                            },
                            msg: "Account Activated Successfully",
                        });
                    });
                });
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
exports.logout = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const cookieOptions = {
            expires: new Date(Date.now()),
            path: "/",
            sameSite: "none",
            domain: "localhost",
        };
        if (process.env.NODE_ENV === "production") {
            cookieOptions.httpOnly = true;
            cookieOptions.secure = true;
            cookieOptions.domain = process.env.COOKIE_DOMAIN;
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
