import { NextFunction, Request, Response, CookieOptions } from "express";
import { config } from "dotenv";
import { hash } from "bcryptjs";
import * as Joi from "joi";
import AppError from "../utils/app-error";
import catchAsync from "../utils/catch-async";
import { signToken } from "../utils/auth";
import db from "../db";
import roles from "../data/roles";
config();

type UserT = {
  name: string;
  email: string;
  password: string;
};

export const addUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      type ReqBodyT = {
        name: string;
        email: string;
        password: string;
        role: string;
      };
      const user = req.body as ReqBodyT;

      // defining user schema
      const schema = Joi.object<ReqBodyT>({
        name: Joi.string().min(3).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(50).required(),
        role: Joi.number()
          .integer()
          .allow(...roles),
      });

      // validating request body again schema
      const { error: validationError } = schema.validate(user);
      if (!validationError) {
        const { name, email, password, role } = user;
        // hashing password for security purpose
        const hashedPassword = await hash(password, 12);

        // adding user data to db
        db.query(
          {
            sql: `INSERT INTO
            users (
              name,
              email,
              role,
              password
            ) VALUES (
              ?,
              ?,
              ?,
              ?
            );`,
            values: [name, email, role, hashedPassword],
          },
          (err, results, fields) => {
            if (err) {
              if (err.errno === 1062) {
                return next(
                  new AppError(
                    `User with email '${email}' already exists!`,
                    403
                  )
                );
              }
              console.error(err);
              return next(new AppError(err.message, 403));
            }

            const obj = Object.assign({}, user);
            delete obj.password;

            const token = signToken(obj);

            const cookieOptions: CookieOptions = {
              expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
              path: "/",
              sameSite: "none",
              secure: true,
              domain: "localhost",
            };
            if (process.env.NODE_ENV === "production") {
              cookieOptions.httpOnly = true;
              cookieOptions.secure = true;
              cookieOptions.domain = "ftdealer.com";
            }
            res.cookie("jwt", token, cookieOptions);

            // sending response
            res.status(200).json({
              status: true,
              data: {
                name: obj.name,
                email: obj.email,
              },
              msg: "User Added Successfully",
            });
          }
        );
      } else {
        return next(new AppError(validationError.details[0].message, 400));
      }
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);
