"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getAllUsers = exports.addUser = void 0;
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
exports.getAllUsers = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        db_1.default.query(`
        SELECT
          u.name,
          email,
          r.title as role
        FROM
          (users as u
          LEFT JOIN (roles as r) ON (u.role = r.id));
        `, (err, results, fields) => {
            if (err) {
                console.error(err);
                return next(new app_error_1.default(err.message, 403));
            }
            // sending response
            res.status(200).json({
                status: true,
                data: results,
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.updateUser = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const user = req.body;
        const { email } = req.params;
        // defining user schema
        const schema = Joi.object({
            name: Joi.string().min(3).required(),
            role: Joi.number()
                .integer()
                .allow(...roles_1.default)
                .required(),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(user);
        if (!validationError && email) {
            // getting user to update
            const getUserQuery = `
        SELECT
          role
        FROM
          users
        WHERE
          email = "${email};"
        `;
            db_1.default.query(getUserQuery, (err, result, fields) => {
                if (err) {
                    console.error(err);
                    return next(new app_error_1.default(err.message, 500));
                }
                // @ts-ignore
                else if (result.affectedRows === 0) {
                    return next(new app_error_1.default(`User with email "${email}" not found!`, 404));
                }
                // function to actually perform the update
                const performUpdate = () => {
                    const { name, role } = user;
                    const updateQuery = `
            UPDATE
              users
            SET
              name = ?,
              role = ?
            WHERE
              email = ?;
            `;
                    db_1.default.query({
                        sql: updateQuery,
                        values: [name, role, email],
                    }, (err, results, fields) => {
                        if (err) {
                            console.error(err);
                            return next(new app_error_1.default(err.message, 403));
                        }
                        // @ts-ignore
                        else if (results.affectedRows === 0) {
                            return next(new app_error_1.default(`User with email "${email}" not found!`, 404));
                        }
                        // sending response
                        res.status(200).json({
                            status: true,
                            msg: "User Updated Successfully",
                        });
                    });
                };
                // if user type was admin and is now being set to some other role
                if (result[0].role === 1 && user.role !== 1) {
                    const adminCountQuery = `
            SELECT
              COUNT(role) as admin_count
            FROM
              users
            WHERE
              role = 1;
            `;
                    db_1.default.query(adminCountQuery, (err, result, fields) => {
                        if (err) {
                            return next(new app_error_1.default(err.message, 500));
                        }
                        const [{ admin_count }] = result;
                        if (admin_count === 1) {
                            return next(new app_error_1.default("Unable to edit role as no other admin exists", 400));
                        }
                        performUpdate();
                    });
                }
                else {
                    performUpdate();
                }
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
