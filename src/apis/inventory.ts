import { NextFunction, Request, Response } from "express";
import { config } from "dotenv";
import * as Joi from "joi";
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

export const getFilledDates = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const { email } = req.user;
      type SubmissionT = {
        date_added: string;
        ts: Date;
      };
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
            ts: Date,
            date_added: string
          ) => Promise<InventoryDataT>;
          const fetchRecordByDate: FetchRecordReturnT = (ts, date_added) => {
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
              db.query(
                {
                  sql: getRecordQuery,
                  values: [ts],
                },
                (err, results: RecordItem[], fields) => {
                  if (err) {
                    console.error(err);
                    return rej(err.message);
                  }

                  res({
                    date: date_added,
                    data: results.map((r) => r.qty),
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
                trailers;
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
              submission.ts,
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
            },
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
        db.query(
          `SELECT CURRENT_TIMESTAMP(2) as ts;`,
          (err, results: { ts: Date }[]) => {
            if (err) {
              console.error(err);
              return next(new AppError(err.message, 500));
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
            db.query(
              {
                sql: insertSubmissionQuery,
                values: [email, ts],
              },
              (err) => {
                if (err) {
                  console.error(err);
                  return next(new AppError(err.message, 500));
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
