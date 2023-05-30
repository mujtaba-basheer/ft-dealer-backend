"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.deleteUser = exports.getAllUsers = void 0;
const dotenv_1 = require("dotenv");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
const db_1 = require("../db");
(0, dotenv_1.config)();
exports.getAllUsers = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        db_1.default.query(`SELECT name, email, phone FROM users;`, (err, results, fields) => {
            if (err)
                return next(new app_error_1.default(err.message, 403));
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
exports.deleteUser = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const email = req.params.email;
        if (email) {
            db_1.default.query(`DELETE FROM users WHERE email="${email}";`, (err, results, fields) => {
                if (err)
                    return next(new app_error_1.default(err.message, 403));
                // @ts-ignore
                else if (results.affectedRows === 0) {
                    res.status(404).json({
                        status: false,
                        msg: `User Not Found`,
                    });
                }
                else {
                    res.status(200).json({
                        status: true,
                        msg: `Deleted user with email: ${email}`,
                    });
                }
            });
        }
        else
            throw new Error("Invalid params");
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.getMe = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        db_1.default.query(`SELECT name, email, mobile FROM users WHERE email = "${req.user.email}";`, (err, results, fields) => {
            if (err)
                return next(new app_error_1.default(err.message, 403));
            if (results.length === 0) {
                return next(new app_error_1.default("User not found!", 404));
            }
            res.status(200).json({
                status: true,
                data: results[0],
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
