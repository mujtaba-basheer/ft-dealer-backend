import { CookieOptions, NextFunction, Request, Response } from "express";
import { hash, compare } from "bcryptjs";
import * as Joi from "joi";
import { signToken } from "../utils/auth";
import AppError from "../utils/app-error";
import catchAsync from "../utils/catch-async";
import { config } from "dotenv";
import db from "../db";
import { decode } from "jsonwebtoken";
config();

type UserT = {
  name: string;
  email: string;
  role: number;
  password: string;
};
type JwtDecodedT = {
  email: string;
  name: string;
};

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      type ReqBody = {
        email: string;
        password: string;
      };
      const body = req.body as ReqBody;

      // defining request body schema
      const schema = Joi.object<ReqBody>({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(50).required(),
      });

      // validating request body again schema
      const { error: validationError } = schema.validate(body);
      if (!validationError) {
        const { email, password } = body;

        db.query(
          {
            sql: `
            SELECT
              email, password, role, name
            FROM
              users
            WHERE
              email = ?;
          `,
            values: [email],
          },
          async (err, results: UserT[], fields) => {
            if (err) return next(new AppError(err.message, 403));

            if (results.length === 0)
              return next(new AppError("User not found", 404));

            const user = results[0];
            if (await compare(password, user.password)) {
              const obj = Object.assign({}, user);
              delete obj.password;

              const token = signToken(obj);

              const cookieOptions: CookieOptions = {
                expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
                path: "/",
                sameSite: "none",
                domain: "localhost",
              };
              if (process.env.NODE_ENV === "production") {
                cookieOptions.httpOnly = true;
                cookieOptions.domain = "ftdealer.com";
              }
              res.cookie("jwt", token, cookieOptions);

              res.status(200).json({
                status: true,
                data: {
                  name: obj.name,
                  email: obj.email,
                },
                msg: "Logged In Successfully",
              });
            } else
              return next(new AppError("Incorrect email or password", 401));
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

export const googleLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      type ReqBody = {
        credentials: string;
      };
      const body = req.body as ReqBody;

      // defining request body schema
      const schema = Joi.object<ReqBody>({
        credentials: Joi.string().required(),
      });

      // validating request body again schema
      const { error: validationError } = schema.validate(body);
      if (!validationError) {
        const { credentials } = body;
        const { email } = decode(credentials) as JwtDecodedT;

        db.query(
          `SELECT
            email, name
          FROM
            users
          WHERE
            email = "${email}"
          `,
          async (err, results: UserT[], fields) => {
            if (err) return next(new AppError(err.message, 403));

            if (results.length === 0)
              return next(new AppError("No user found with this email", 404));

            const user = results[0];
            const obj = Object.assign({}, user);

            const token = signToken(obj);

            const cookieOptions: CookieOptions = {
              expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
              path: "/",
              sameSite: "none",
              secure: true,
            };
            if (process.env.NODE_ENV === "production") {
              cookieOptions.httpOnly = true;
              cookieOptions.secure = true;
              cookieOptions.domain = "takeuforward.org";
            }
            res.cookie("jwt", token, cookieOptions);

            res.status(200).json({
              status: true,
              data: {
                name: obj.name,
                email: obj.email,
              },
              msg: "Logged In Successfully",
            });
          }
        );
      } else {
        console.log(validationError);
        return next(new AppError("Missing or invalid parameters", 400));
      }
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);

export const googleSignup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      type ReqBody = {
        credentials: string;
      };
      const body = req.body as ReqBody;

      // defining request body schema
      const schema = Joi.object<ReqBody>({
        credentials: Joi.string().required(),
      });

      // validating request body again schema
      const { error: validationError } = schema.validate(body);
      if (!validationError) {
        const { credentials } = body;
        const { email, name } = decode(credentials) as JwtDecodedT;

        // adding user data to db
        db.query(
          `INSERT INTO
          users (
            name,
            email
          ) VALUES (
            "${name}",
            "${email}"
          );`,
          (err, results, fields) => {
            if (err) {
              console.error(err);
              return next(
                new AppError(
                  err.errno === 1062
                    ? `User with email '${email}' already exists!`
                    : err.message,
                  403
                )
              );
            }

            const token = signToken({ name, email });

            const cookieOptions: CookieOptions = {
              expires: new Date(Date.now() + +process.env.COOKIE_EXPIRES_IN),
              path: "/",
              sameSite: "none",
              secure: true,
            };
            if (process.env.NODE_ENV === "production") {
              cookieOptions.httpOnly = true;
              cookieOptions.secure = true;
              cookieOptions.domain = "takeuforward.org";
            }
            res.cookie("jwt", token, cookieOptions);

            // sending response
            res.status(200).json({
              status: true,
              data: {
                name,
                email,
              },
              msg: "Account Created Successfully",
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

export const logout = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const cookieOptions: CookieOptions = {
        expires: new Date(Date.now()),
        path: "/",
        sameSite: "none",
        secure: true,
      };
      if (process.env.NODE_ENV === "production") {
        cookieOptions.httpOnly = true;
        cookieOptions.secure = true;
        cookieOptions.domain = "takeuforward.org";
      }
      res.clearCookie("jwt", cookieOptions);

      res.status(200).json({
        status: true,
        msg: "Logging out...",
      });
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);
