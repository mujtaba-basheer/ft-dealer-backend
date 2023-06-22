"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInventoryRecord = exports.getAllTrailers = void 0;
const dotenv_1 = require("dotenv");
const Joi = require("joi");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
const db_1 = require("../db");
(0, dotenv_1.config)();
exports.getAllTrailers = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const fetchTrailersQuery = `
      SELECT
        *
      FROM
        trailers
      ORDER BY
        (category) DESC;
      `;
        db_1.default.query(fetchTrailersQuery, (err, results, fields) => {
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
exports.addInventoryRecord = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const body = req.body;
        // defining request body schema
        const schema = Joi.array().items(Joi.object({
            model_no: Joi.string().required(),
            qty: Joi.number().integer().greater(-1).required(),
        }));
        // validating request body again schema
        const { error: validationError } = schema.validate(body);
        if (!validationError) {
            const { email } = req.user;
            const date = new Date().toISOString().substring(0, 10);
            let values = body.map((t) => {
                const { model_no, qty } = t;
                return `
          (
            "${date}",
            "${model_no}",
            ${qty},
            "${email}"
          )
          `;
            });
            const insertQuery = `
        INSERT INTO
          dealer_inventory
          (
            date_added,
            model_no,
            qty,
            email
          )
        VALUES
          ${values.join(",")};
        `;
            db_1.default.query(insertQuery, (err, results, fields) => {
                if (err) {
                    console.error(err);
                    return next(new app_error_1.default(err.message, 403));
                }
                // sending response
                res.status(200).json({
                    status: true,
                    msg: "Record added successfully",
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
