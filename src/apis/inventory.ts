import { NextFunction, Request, Response } from "express";
import { config } from "dotenv";
import * as Joi from "joi";
import * as fs from "node:fs";
import { stringify } from "csv-stringify";
import AppError from "../utils/app-error";
import catchAsync from "../utils/catch-async";
import { inventoryDateNumLimit } from "../data/limits";
import db from "../db";
import { QueryError } from "mysql2";
config();

type UserT = {
  name: string;
  email: string;
  password: string;
  role: number;
};
type TrailerT = {
  name: string;
  model_no: string;
  category: string;
};
type InventorySectionT = {
  category: string;
  selected: number;
  items: (TrailerT & { qty: number })[];
};
type InventoryItemT = {
  model_no: string;
  qty: number;
};

export const getSubmissions = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const { email } = req.user;
      type SubmissionT = {
        date: string;
        date_added: string;
      };
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
      db.query(
        { sql: fetchSubmissionsQuery, values: [email, inventoryDateNumLimit] },
        async (err: QueryError, results: SubmissionT[], fields) => {
          if (err) {
            console.error(err);
            return next(new AppError(err.message, 403));
          }

          type RecordItem = {
            name: string;
            model_no: string;
            category: string;
            qty: number;
          };
          type InventoryDataT = {
            date: string;
            data: number[];
          };
          type FetchRecordReturnT = (
            date: string,
            date_added: string
          ) => Promise<InventoryDataT>;
          const fetchRecordByDate: FetchRecordReturnT = (date, date_added) => {
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
              db.query(
                {
                  sql: getRecordQuery,
                  values: [email, date],
                },
                (err, results: RecordItem[], fields) => {
                  if (err) {
                    console.error(err);
                    return rej(err.message);
                  }

                  res({
                    date: date_added,
                    data: results.map((r) => r.qty ?? 0),
                  });
                }
              );
            });
          };

          type FetchTrailersReturnT = () => Promise<TrailerT[]>;
          const fetchTrailers: FetchTrailersReturnT = () => {
            return new Promise((res, rej) => {
              const getRecordQuery = `
              SELECT
                *
              FROM
                trailers
              ORDER BY category;
              `;
              db.query(getRecordQuery, (err, results: TrailerT[], fields) => {
                if (err) {
                  console.error(err);
                  return rej(err.message);
                }

                res(results);
              });
            });
          };

          const promises: Promise<InventoryDataT | TrailerT[]>[] = [
            fetchTrailers(),
          ];
          for (const submission of results) {
            const promise = fetchRecordByDate(
              submission.date,
              submission.date_added
            );
            promises.push(promise);
          }

          const [trailers, ...records] = await Promise.all(promises);

          // sending response
          res.status(200).json({
            status: true,
            data: {
              trailers,
              records,
              categories: Array.from(
                new Set<string>((trailers as TrailerT[]).map((t) => t.category))
              ),
            },
          });
        }
      );
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);

export const getSubmissionsCSV = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const { email } = req.user;
      type SubmissionT = {
        date: string;
        yyyymm: string;
      };
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
      db.query(
        { sql: fetchSubmissionsQuery, values: [email, inventoryDateNumLimit] },
        async (err: QueryError, results: SubmissionT[], fields) => {
          if (err) {
            console.error(err);
            return next(new AppError(err.message, 403));
          }

          type RecordItem = {
            name: string;
            model_no: string;
            category: string;
            qty: number;
          };
          type InventoryDataT = {
            date: string;
            data: RecordItem[];
          };
          type FetchRecordReturnT = (
            yyyymm: string,
            date: string
          ) => Promise<InventoryDataT>;
          const fetchRecordByDate: FetchRecordReturnT = (yyyymm, date) => {
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
              db.query(
                {
                  sql: getRecordQuery,
                  values: [email, yyyymm],
                },
                (err, results: RecordItem[], fields) => {
                  if (err) {
                    console.error(err);
                    return rej(err.message);
                  }

                  res({
                    date,
                    data: results,
                  });
                }
              );
            });
          };

          const promises: Promise<InventoryDataT>[] = [];
          for (const submission of results) {
            const promise = fetchRecordByDate(
              submission.yyyymm,
              submission.date
            );
            promises.push(promise);
          }

          const records = await Promise.all(promises);

          // writing fetched records to csv

          const columns = ["Category", "Name", "Model No."];
          records.forEach((r) => columns.push(r.date));

          const stringifier = stringify({
            header: true,
            columns,
          });

          const ts = new Date().toISOString().replace(/:/g, "-");
          const ws = fs.createWriteStream(`files/${ts}.csv`);
          stringifier.pipe(ws);

          for (let i = 0; i < records[0].data.length; i++) {
            const rowData: (string | number)[] = [];

            rowData.push(records[0].data[i].category);
            rowData.push(records[0].data[i].name);
            rowData.push(records[0].data[i].model_no);

            for (const record of records) {
              rowData.push(record.data[i].qty ?? 0);
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
        }
      );
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);

export const getGlobalInventoryItems = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const fetchTrailersQuery = `
        SELECT
          *
        FROM
          trailers
        ORDER BY
          (category) DESC;
        `;
      db.query(fetchTrailersQuery, (err, results: TrailerT[], fields) => {
        if (err) {
          console.error(err);
          return next(new AppError(err.message, 403));
        }

        // sending response
        res.status(200).json({
          status: true,
          data: results,
        });
      });
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);

export const addInventoryRecord = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      type ReqBodyT = InventoryItemT[];
      const body = req.body as ReqBodyT;

      // defining request body schema
      const schema = Joi.array<ReqBodyT>().items(
        Joi.object<InventoryItemT>({
          model_no: Joi.string().required(),
          qty: Joi.number().integer().greater(-1).required(),
        })
      );

      // validating request body again schema
      const { error: validationError } = schema.validate(body);
      if (!validationError) {
        const { email } = req.user;

        // getting current timestamp in MySQL
        type DateTimeT = {
          ts: Date;
        };
        db.query(
          `SELECT CURRENT_TIMESTAMP as ts;`,
          (err, results: DateTimeT[]) => {
            if (err) {
              console.error(err);
              return next(new AppError(err.message, 500));
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
            db.query(
              {
                sql: insertSubmissionQuery,
                values: [email, yyyymm, ts],
              },
              (err) => {
                if (err) {
                  if (err.errno === 1062) {
                    return next(
                      new AppError(
                        "Inventory submission for current month already exists",
                        500
                      )
                    );
                  }
                  console.error(err);
                  return next(new AppError(err.message, 500));
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

                db.query(
                  {
                    sql: insertQuery,
                    values: body.map(() => ts),
                  },
                  (err, results, fields) => {
                    if (err) {
                      console.error(err);
                      return next(new AppError(err.message, 403));
                    }

                    // sending response
                    res.status(200).json({
                      status: true,
                      msg: "Record added successfully",
                    });
                  }
                );
              }
            );
          }
        );
      } else {
        console.log(validationError);
        return next(new AppError(validationError.details[0].message, 400));
      }
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);
