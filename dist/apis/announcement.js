"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllAnnouncements = exports.fetchMyAnnouncement = exports.deleteMyAnnouncement = exports.addAnnouncement = void 0;
const dotenv_1 = require("dotenv");
const Joi = require("joi");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
const db_1 = require("../db");
(0, dotenv_1.config)();
exports.addAnnouncement = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const body = req.body;
        // defining request body schema
        const allowed_types = ["General", "Warning", "Urgent"];
        const validateType = (value, helpers) => {
            if (!allowed_types.includes(value)) {
                return helpers.error("No a valid announcement type");
            }
            return value;
        };
        const schema = Joi.object({
            type: Joi.string().required().custom(validateType),
            title: Joi.string().required(),
            body: Joi.string().required(),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(body);
        if (!validationError) {
            const { email } = req.user;
            const { body: aBody, title, type } = body;
            const deleteQuery = `
        DELETE FROM
          announcements
        WHERE
          email = "${email}";
        `;
            db_1.default.query(deleteQuery, (err, result) => {
                if (err) {
                    console.error(err);
                    return next(new app_error_1.default(err.message, 500));
                }
                const insertQuery = `
            INSERT INTO
                announcements
            (
                email,
                date,
                title,
                type,
                body
            )
            VALUES
            (
                "${email}",
                CURRENT_TIMESTAMP,
                ?,
                "${type}",
                ?
            );
            `;
                db_1.default.query(insertQuery, [title, aBody], (err, result) => {
                    if (err) {
                        console.error(err);
                        return next(new app_error_1.default(err.message, 500));
                    }
                    res.json({
                        status: true,
                        msg: "Announcement added successfully!",
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
exports.deleteMyAnnouncement = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const { email } = req.user;
        const deleteQuery = `
      DELETE FROM
        announcements
      WHERE
        email = "${email}";
      `;
        db_1.default.query(deleteQuery, (err, result) => {
            if (err) {
                console.error(err);
                return next(new app_error_1.default(err.message, 500));
            }
            res.json({
                status: true,
                msg: "Announcement deleted successfully!",
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.fetchMyAnnouncement = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const { email } = req.user;
        const selectQuery = `
      SELECT
        title,
        type,
        body
      FROM
        announcements
      WHERE
        email = ?;
      `;
        db_1.default.query(selectQuery, [email], (err, results) => {
            if (err) {
                console.error(err);
                return next(new app_error_1.default(err.message, 500));
            }
            res.json({
                status: true,
                data: results[0],
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.fetchAllAnnouncements = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const selectQuery = `
        SELECT
          title,
          type,
          body
        FROM
          announcements
        ORDER BY date DESC;
        `;
        db_1.default.query(selectQuery, (err, results) => {
            if (err) {
                console.error(err);
                return next(new app_error_1.default(err.message, 500));
            }
            res.json({
                status: true,
                data: results,
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
