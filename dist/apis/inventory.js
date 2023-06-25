"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInventoryRecord = exports.getGlobalInventoryItems = exports.getFilledDates = void 0;
const dotenv_1 = require("dotenv");
const Joi = require("joi");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
const limits_1 = require("../data/limits");
const db_1 = require("../db");
(0, dotenv_1.config)();
exports.getFilledDates = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const { email } = req.user;
        const fetchSubmissionsQuery = `
      SELECT
        DATE_FORMAT(date_added, "%D %b, %y") as date_added,
        ts
      FROM
        inventory_submissions
      WHERE
        email = ?
      ORDER BY
        ts DESC
      LIMIT
        ?;
      `;
        db_1.default.query({ sql: fetchSubmissionsQuery, values: [email, limits_1.inventoryDateNumLimit] }, async (err, results, fields) => {
            if (err) {
                console.error(err);
                return next(new app_error_1.default(err.message, 403));
            }
            const fetchRecordByDate = (ts, date_added) => {
                return new Promise((res, rej) => {
                    const getRecordQuery = `
              SELECT
                i.qty
              FROM
                trailers as t
              LEFT JOIN dealer_inventory as i ON (
                t.model_no = i.model_no
                AND i.ts = ?
              );
              `;
                    db_1.default.query({
                        sql: getRecordQuery,
                        values: [ts],
                    }, (err, results, fields) => {
                        if (err) {
                            console.error(err);
                            return rej(err.message);
                        }
                        res({
                            date: date_added,
                            data: results.map((r) => r.qty),
                        });
                    });
                });
            };
            const fetchTrailers = () => {
                return new Promise((res, rej) => {
                    const getRecordQuery = `
              SELECT
                *
              FROM
                trailers;
              `;
                    db_1.default.query(getRecordQuery, (err, results, fields) => {
                        if (err) {
                            console.error(err);
                            return rej(err.message);
                        }
                        res(results);
                    });
                });
            };
            const promises = [
                fetchTrailers(),
            ];
            for (const submission of results) {
                const promise = fetchRecordByDate(submission.ts, submission.date_added);
                promises.push(promise);
            }
            const [trailers, ...records] = await Promise.all(promises);
            // sending response
            res.status(200).json({
                status: true,
                data: {
                    trailers,
                    records,
                },
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.getGlobalInventoryItems = (0, catch_async_1.default)(async (req, res, next) => {
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
            // getting current timestamp in MySQL
            db_1.default.query(`SELECT CURRENT_TIMESTAMP(2) as ts;`, (err, results) => {
                if (err) {
                    console.error(err);
                    return next(new app_error_1.default(err.message, 500));
                }
                const [{ ts }] = results;
                const insertSubmissionQuery = `
              INSERT INTO
                inventory_submissions
                (
                  email,
                  date_added,
                  ts
                )
                VALUES
                (
                  ?,
                  CURRENT_DATE(),
                  ?
                );
              `;
                // res.json({ status: true });
                // return;
                db_1.default.query({
                    sql: insertSubmissionQuery,
                    values: [email, ts],
                }, (err) => {
                    if (err) {
                        console.error(err);
                        return next(new app_error_1.default(err.message, 500));
                    }
                    let values = body.map((t) => {
                        const { model_no, qty } = t;
                        return `
                    (
                      ?,
                      "${model_no}",
                      ${qty}
                    )
                    `;
                    });
                    const insertQuery = `
                  INSERT INTO
                    dealer_inventory
                    (
                      ts,
                      model_no,
                      qty
                    )
                  VALUES
                    ${values.join(",")};
                  `;
                    db_1.default.query({
                        sql: insertQuery,
                        values: body.map(() => ts),
                    }, (err, results, fields) => {
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
