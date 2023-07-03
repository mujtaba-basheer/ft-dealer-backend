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
type AnnouncementT = {
  type: string;
  title: string;
  body: string;
};

export const addAnnouncement = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      type ReqBodyT = AnnouncementT;
      const body = req.body as ReqBodyT;

      // defining request body schema
      const allowed_types: string[] = ["General", "Warning", "Urgent"];
      const validateType: Joi.CustomValidator<string> = (value, helpers) => {
        if (!allowed_types.includes(value)) {
          return helpers.error("No a valid announcement type");
        }
        return value;
      };
      const schema = Joi.object<ReqBodyT>({
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
        db.query(deleteQuery, (err, result) => {
          if (err) {
            console.error(err);
            return next(new AppError(err.message, 500));
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
          db.query(insertQuery, [title, aBody], (err, result) => {
            if (err) {
              console.error(err);
              return next(new AppError(err.message, 500));
            }

            res.json({
              status: true,
              msg: "Announcement added successfully!",
            });
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

export const deleteMyAnnouncement = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const { email } = req.user;

      const deleteQuery = `
      DELETE FROM
        announcements
      WHERE
        email = "${email}";
      `;
      db.query(deleteQuery, (err, result) => {
        if (err) {
          console.error(err);
          return next(new AppError(err.message, 500));
        }

        res.json({
          status: true,
          msg: "Announcement deleted successfully!",
        });
      });
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);

export const fetchMyAnnouncement = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
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
      db.query(selectQuery, [email], (err, results) => {
        if (err) {
          console.error(err);
          return next(new AppError(err.message, 500));
        }

        res.json({
          status: true,
          data: results[0],
        });
      });
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);

export const fetchAllAnnouncements = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
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
      db.query(selectQuery, (err, results) => {
        if (err) {
          console.error(err);
          return next(new AppError(err.message, 500));
        }

        res.json({
          status: true,
          data: results,
        });
      });
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);
