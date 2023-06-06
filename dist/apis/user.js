"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUser = void 0;
const dotenv_1 = require("dotenv");
const bcryptjs_1 = require("bcryptjs");
const Joi = require("joi");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
const auth_1 = require("../utils/auth");
const db_1 = require("../db");
const roles_1 = require("../data/roles");
(0, dotenv_1.config)();
exports.addUser = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const user = req.body;
        // defining user schema
        const schema = Joi.object({
            name: Joi.string().min(3).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(50).required(),
            role: Joi.number()
                .integer()
                .allow(...roles_1.default),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(user);
        if (!validationError) {
            const { name, email, password, role } = user;
            // hashing password for security purpose
            const hashedPassword = await (0, bcryptjs_1.hash)(password, 12);
            // adding user data to db
            db_1.default.query({
                sql: `INSERT INTO
            users (
              name,
              email,
              role,
              password
            ) VALUES (
              ?,
              ?,
              ?,
              ?
            );`,
                values: [name, email, role, hashedPassword],
            }, (err, results, fields) => {
                if (err) {
                    if (err.errno === 1062) {
                        return next(new app_error_1.default(`User with email '${email}' already exists!`, 403));
                    }
                    console.error(err);
                    return next(new app_error_1.default(err.message, 403));
                }
                const obj = Object.assign({}, user);
                delete obj.password;
                const token = (0, auth_1.signToken)(obj);
                const cookieOptions = {
                    expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
                    path: "/",
                    sameSite: "none",
                    secure: true,
                    domain: "localhost",
                };
                if (process.env.NODE_ENV === "production") {
                    cookieOptions.httpOnly = true;
                    cookieOptions.secure = true;
                    cookieOptions.domain = "ftdealer.com";
                }
                res.cookie("jwt", token, cookieOptions);
                // sending response
                res.status(200).json({
                    status: true,
                    data: {
                        name: obj.name,
                        email: obj.email,
                    },
                    msg: "User Added Successfully",
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
