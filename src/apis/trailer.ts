import { NextFunction, Request, Response } from "express";
import { config } from "dotenv";
import * as Joi from "joi";
import AppError from "../utils/app-error";
import catchAsync from "../utils/catch-async";
import db from "../db";
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

export const getAllTrailers = catchAsync(
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
        db.query(insertQuery, (err, results, fields) => {
          if (err) {
            console.error(err);
            return next(new AppError(err.message, 403));
          }

          // sending response
          res.status(200).json({
            status: true,
            msg: "Record added successfully",
          });
        });
      } else {
        console.log(validationError);
        return next(new AppError(validationError.details[0].message, 400));
      }
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);
