"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNote = exports.updateProgress = exports.getTopicsSDE = exports.getTopicsA2Z = void 0;
const dotenv_1 = require("dotenv");
const Joi = require("joi");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
const db_1 = require("../db");
(0, dotenv_1.config)();
exports.getTopicsA2Z = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        let qs = "";
        let isLoggedIn = false;
        if (req.user) {
            const email = req.user.email;
            isLoggedIn = true;
            qs = `
        SELECT
          t.id,
          t.title,
          t.step_no,
          t.yt_link,
          t.lc_link,
          t.gfg_link,
          t.post_link,
          t.sl_no_a2z,
          t.sub_step_no,
          n.text as note,
          p.progress as status,
          s.title as step_title,
          ss.title as sub_step_title
        FROM
          (
            topics as t
            INNER JOIN (
              sub_steps as ss
              INNER JOIN steps as s ON (ss.step_no = s.sl_no)
            ) ON (
              t.step_no = s.sl_no
              AND t.sub_step_no = ss.sl_no
            )
          )
          LEFT JOIN (progress as p) ON (
            p.email = "${email}"
            AND p.q_id = t.id
          )
          LEFT JOIN (notes as n) ON (
            n.email = "${email}"
            AND n.q_id = t.id
          )
        ORDER BY
          t.step_no,
          t.sub_step_no,
          t.sl_no_a2z;
        `;
        }
        else {
            qs = `
        SELECT
          t.id,
          t.title,
          t.step_no,
          t.yt_link,
          t.lc_link,
          t.gfg_link,
          t.post_link,
          t.sl_no_a2z,
          t.sub_step_no,
          s.title as step_title,
          ss.title as sub_step_title
        FROM
          (
            topics as t
            INNER JOIN (
              sub_steps as ss
              INNER JOIN steps as s ON (ss.step_no = s.sl_no)
            ) ON (
              t.step_no = s.sl_no
              AND t.sub_step_no = ss.sl_no
            )
          )
        ORDER BY
          t.step_no,
          t.sub_step_no,
          t.sl_no_a2z;
        `;
        }
        db_1.default.query(qs, (err, results, fields) => {
            if (err)
                return next(new app_error_1.default(err.message, 403));
            let c_s = -1; // current step
            let c_ss = -1; // current sub_step;
            const steps = [];
            for (let i = 0; i < results.length; i++) {
                const topic = results[i];
                const { step_no, sub_step_no, step_title, sub_step_title } = topic;
                if (step_no - 1 > c_s) {
                    steps.push({
                        sl_no: step_no,
                        title: step_title,
                        sub_steps: [
                            {
                                sl_no: sub_step_no,
                                title: sub_step_title,
                                topics: [],
                            },
                        ],
                    });
                    c_s++;
                    c_ss = 0;
                }
                else if (sub_step_no - 1 > c_ss) {
                    steps[c_s].sub_steps.push({
                        sl_no: sub_step_no,
                        title: sub_step_title,
                        topics: [],
                    });
                    c_ss++;
                }
                try {
                    steps[c_s].sub_steps[c_ss].topics.push(topic);
                }
                catch (error) {
                    console.error(error);
                }
            }
            res.status(200).json({
                status: true,
                data: steps,
                credentials: isLoggedIn,
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.getTopicsSDE = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        let qs = "";
        let isLoggedIn = false;
        if (req.user) {
            const email = req.user.email;
            isLoggedIn = true;
            qs = `
        SELECT
          t.id,
          t.tags,
          t.title,
          t.day_no,
          t.p1_link,
          t.p2_link,
          t.yt_link,
          t.post_link,
          t.sl_no_sde,
          n.text as note,
          p.progress as status,
          d.title as day_title,
          d.description as day_description
        FROM
          (
            topics as t
            INNER JOIN (days as d) ON (
              t.sl_no_sde IS NOT NULL
              AND t.day_no = d.sl_no
            )
          )
          LEFT JOIN (progress as p) ON (
            p.email = "${email}"
            AND p.q_id = t.id
          )
          LEFT JOIN (notes as n) ON (
            n.email = "${email}"
            AND n.q_id = t.id
          )
        ORDER BY
          t.day_no,
          t.sl_no_sde;
        `;
        }
        else {
            qs = `
        SELECT
          t.id,
          t.title,
          t.day_no,
          t.p1_link,
          t.p2_link,
          t.yt_link,
          t.post_link,
          t.sl_no_sde,
          d.title as day_title,
          d.description as day_description
        FROM
          topics as t
          INNER JOIN (days as d) ON (
            t.sl_no_sde IS NOT NULL
            AND t.day_no = d.sl_no
          )
        ORDER BY
          t.day_no,
          t.sl_no_sde;
        `;
        }
        db_1.default.query(qs, (err, results, fields) => {
            if (err)
                return next(new app_error_1.default(err.message, 403));
            let c_d = -1; // current day
            const days = [];
            for (let i = 0; i < results.length; i++) {
                const topic = results[i];
                const { day_no, day_title, day_description } = topic;
                if (day_no - 1 > c_d) {
                    days.push({
                        sl_no: day_no,
                        title: day_title,
                        description: day_description,
                        topics: [],
                    });
                    c_d++;
                }
                try {
                    days[c_d].topics.push(topic);
                }
                catch (error) {
                    console.error(error);
                }
            }
            res.status(200).json({
                status: true,
                data: days,
                credentials: isLoggedIn,
            });
        });
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.updateProgress = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const user = req.user;
        const schema = Joi.object({
            progress: Joi.number().integer().greater(-1).less(3).required(),
            id: Joi.string().required(),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(req.body);
        if (!validationError) {
            const { progress, id: q_id } = req.body;
            const { email } = user;
            try {
                const qs_update = `
          UPDATE progress
          SET
            progress = ${progress}
          WHERE
            email = "${email}"
            AND
            q_id = "${q_id}";
          `;
                db_1.default.query(qs_update, (updateErr, results, fields) => {
                    if (updateErr)
                        return next(new app_error_1.default(updateErr.message, 403));
                    if (results.affectedRows === 0) {
                        db_1.default.query(`
                INSERT INTO
                  progress (
                    email,
                    q_id,
                    progress
                  )  VALUES (
                    "${email}",
                    "${q_id}",
                    ${progress}
                  );
                `, (insertErr, results, fields) => {
                            if (insertErr) {
                                return next(new app_error_1.default(insertErr.message, 403));
                            }
                            else {
                                res.status(200).json({
                                    status: true,
                                    msg: "Progress updated",
                                });
                            }
                        });
                    }
                    else {
                        res.status(200).json({
                            status: true,
                            msg: "Progress updated",
                        });
                    }
                });
            }
            catch (error) {
                console.error(error);
                return next(new app_error_1.default(error.message, 403));
            }
        }
        else {
            console.log({ validationError });
            return next(new app_error_1.default("Missing or invalid parameters", 400));
        }
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
exports.updateNote = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const user = req.user;
        const schema = Joi.object({
            text: Joi.string().max(4000).allow("").required(),
            id: Joi.string().required(),
        });
        // validating request body again schema
        const { error: validationError } = schema.validate(req.body);
        if (!validationError) {
            const { text, id: q_id } = req.body;
            const { email } = user;
            try {
                const qs_update = `
          UPDATE notes
          SET
            text = ?
          WHERE
            email = "${email}"
            AND
            q_id = "${q_id}";
          `;
                db_1.default.query({
                    sql: qs_update,
                    values: [text],
                }, (updateErr, results, fields) => {
                    if (updateErr)
                        return next(new app_error_1.default(updateErr.message, 403));
                    if (results.affectedRows === 0) {
                        const qs_insert = `
                INSERT INTO
                  notes (
                    email,
                    q_id,
                    text
                  )  VALUES (
                    "${email}",
                    "${q_id}",
                    ?
                  );
                `;
                        db_1.default.query({ sql: qs_insert, values: [text] }, (insertErr, results, fields) => {
                            if (insertErr) {
                                return next(new app_error_1.default(insertErr.message, 403));
                            }
                            else {
                                res.status(200).json({
                                    status: true,
                                    msg: "Note updated",
                                });
                            }
                        });
                    }
                    else {
                        res.status(200).json({
                            status: true,
                            msg: "Note updated",
                        });
                    }
                });
            }
            catch (error) {
                console.error(error);
                return next(new app_error_1.default(error.message, 403));
            }
        }
        else {
            return next(new app_error_1.default(validationError.details[0].message, 400));
        }
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 501));
    }
});
