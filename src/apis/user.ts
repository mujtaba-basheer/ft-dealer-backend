import { NextFunction, Request, Response } from "express";
import { config } from "dotenv";
import AppError from "../utils/app-error";
import catchAsync from "../utils/catch-async";
import db from "../db";
config();

type UserT = {
  name: string;
  email: string;
  mobile?: string;
  password: string;
};

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      db.query(
        `SELECT name, email, phone FROM users;`,
        (err, results, fields) => {
          if (err) return next(new AppError(err.message, 403));

          res.status(200).json({
            status: true,
            data: results,
          });
        }
      );
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);

export const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email: string = req.params.email;
      if (email) {
        db.query(
          `DELETE FROM users WHERE email="${email}";`,
          (err, results, fields) => {
            if (err) return next(new AppError(err.message, 403));
            // @ts-ignore
            else if (results.affectedRows === 0) {
              res.status(404).json({
                status: false,
                msg: `User Not Found`,
              });
            } else {
              res.status(200).json({
                status: true,
                msg: `Deleted user with email: ${email}`,
              });
            }
          }
        );
      } else throw new Error("Invalid params");
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);

export const getMe = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      db.query(
        `SELECT name, email, mobile FROM users WHERE email = "${req.user.email}";`,
        (err, results: UserT[], fields) => {
          if (err) return next(new AppError(err.message, 403));

          if (results.length === 0) {
            return next(new AppError("User not found!", 404));
          }

          res.status(200).json({
            status: true,
            data: results[0],
          });
        }
      );
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);
