"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInventoryRecord = exports.getGlobalInventoryItems = exports.getSubmissionsCSV = exports.getSubmissions = void 0;
const dotenv_1 = require("dotenv");
const Joi = require("joi");
const fs = require("node:fs");
const csv_stringify_1 = require("csv-stringify");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
const limits_1 = require("../data/limits");
const db_1 = require("../db");
(0, dotenv_1.config)();
exports.getSubmissions = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const { email } = req.user;
        const fetchSubmissionsQuery = `
      SELECT
        date,
        DATE_FORMAT(ts, "%b, %y") as date_added
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
            const fetchRecordByDate = (date, date_added) => {
                return new Promise((res, rej) => {
                    const getRecordQuery = `
              SELECT
                i.qty
              FROM
                trailers as t
              LEFT JOIN dealer_inventory as i ON (
                i.email = ?
                AND i.date = ?
                AND t.model_no = i.model_no
              )
              ORDER BY category;
              `;
                    db_1.default.query({
                        sql: getRecordQuery,
                        values: [email, date],
                    }, (err, results, fields) => {
                        if (err) {
                            console.error(err);
                            return rej(err.message);
                        }
                        res({
                            date: date_added,
                            data: results.map((r) => { var _a; return (_a = r.qty) !== null && _a !== void 0 ? _a : 0; }),
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
                trailers
              ORDER BY category;
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
                const promise = fetchRecordByDate(submission.date, submission.date_added);
                promises.push(promise);
            }
            const [trailers, ...records] = await Promise.all(promises);
            // sending response
            res.status(200).json({
                status: true,
                data: {
                    trailers,
                    records,
                    categories: Array.from(new Set(trailers.map((t) => t.category))),
                },
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.getSubmissionsCSV = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const { email } = req.user;
        const fetchSubmissionsQuery = `
      SELECT
        date as yyyymm,
        DATE_FORMAT(ts, "%b, %y") as date
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
            var _a;
            if (err) {
                console.error(err);
                return next(new app_error_1.default(err.message, 403));
            }
            const fetchRecordByDate = (yyyymm, date) => {
                return new Promise((res, rej) => {
                    const getRecordQuery = `
              SELECT
                i.qty,
                t.name,
                t.category,
                t.model_no
              FROM
                trailers as t
              LEFT JOIN dealer_inventory as i ON (
                i.email = ?
                AND i.date = ?
                AND t.model_no = i.model_no
              )
              ORDER BY category;
              `;
                    db_1.default.query({
                        sql: getRecordQuery,
                        values: [email, yyyymm],
                    }, (err, results, fields) => {
                        if (err) {
                            console.error(err);
                            return rej(err.message);
                        }
                        res({
                            date,
                            data: results,
                        });
                    });
                });
            };
            const promises = [];
            for (const submission of results) {
                const promise = fetchRecordByDate(submission.yyyymm, submission.date);
                promises.push(promise);
            }
            const records = await Promise.all(promises);
            // writing fetched records to csv
            const columns = ["Category", "Name", "Model No."];
            records.forEach((r) => columns.push(r.date));
            const stringifier = (0, csv_stringify_1.stringify)({
                header: true,
                columns,
            });
            const ts = new Date().toISOString().replace(/:/g, "-");
            const ws = fs.createWriteStream(`files/${ts}.csv`);
            stringifier.pipe(ws);
            for (let i = 0; i < records[0].data.length; i++) {
                const rowData = [];
                rowData.push(records[0].data[i].category);
                rowData.push(records[0].data[i].name);
                rowData.push(records[0].data[i].model_no);
                for (const record of records) {
                    rowData.push((_a = record.data[i].qty) !== null && _a !== void 0 ? _a : 0);
                }
                stringifier.write(rowData);
            }
            stringifier.end();
            ws.on("close", () => {
                // sending response
                res.status(200);
                res.sendFile(`${ts}.csv`, {
                    "x-timestamp": Date.now(),
                    "x-sent": true,
                    root: "files",
                });
                res.on("finish", () => {
                    fs.unlinkSync(`files/${ts}.csv`);
                });
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
            db_1.default.query(`SELECT CURRENT_TIMESTAMP as ts;`, (err, results) => {
                if (err) {
                    console.error(err);
                    return next(new app_error_1.default(err.message, 500));
                }
                const [{ ts }] = results;
                const yyyymm = ts.toISOString().substring(0, 7);
                const insertSubmissionQuery = `
              INSERT INTO
                inventory_submissions
                (
                  email,
                  date,
                  ts
                )
                VALUES
                (
                  ?,
                  ?,
                  ?
                );
              `;
                db_1.default.query({
                    sql: insertSubmissionQuery,
                    values: [email, yyyymm, ts],
                }, (err) => {
                    if (err) {
                        if (err.errno === 1062) {
                            return next(new app_error_1.default("Inventory submission for current month already exists", 500));
                        }
                        console.error(err);
                        return next(new app_error_1.default(err.message, 500));
                    }
                    let values = body.map((t) => {
                        const { model_no, qty } = t;
                        return `
                    (
                      "${yyyymm}",
                      "${email}",
                      "${model_no}",
                      ${qty}
                    )
                    `;
                    });
                    const insertQuery = `
                  INSERT INTO
                    dealer_inventory
                    (
                      date,
                      email,
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
