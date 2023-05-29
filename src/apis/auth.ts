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
  mobile?: string;
  password: string;
};
type JwtDecodedT = {
  email: string;
  name: string;
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      type ReqBodyT = {
        name: string;
        email: string;
        mobile?: string;
        password: string;
        college: string;
        grdt_yr?: number;
      };
      const user = req.body as ReqBodyT;

      // defining user schema
      const schema = Joi.object<ReqBodyT>({
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(10).max(50).required(),
        mobile: Joi.string()
          .min(8)
          .pattern(/[0-9]+/)
          .optional(),
        college: Joi.string().required(),
        grdt_yr: Joi.number().optional(),
      });

      // validating request body again schema
      const { error: validationError } = schema.validate(user);
      if (!validationError) {
        const { name, email, mobile, password, college, grdt_yr } = user;
        // hashing password for security purpose
        const hashedPassword = await hash(password, 12);

        // adding user data to db
        db.query(
          {
            sql: `INSERT INTO
            users (
              name,
              email,
              mobile,
              password,
              college,
              grdt_yr
            ) VALUES (
              ?,
              ?,
              ${mobile ? `"${mobile}"` : "NULL"},
              "${hashedPassword}",
              ?,
              ${grdt_yr ? `"${grdt_yr}"` : "NULL"}
            );`,
            values: [name, email, college],
          },
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

            const obj = Object.assign({}, user);
            delete obj.password;
            delete obj.mobile;

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

            // sending response
            res.status(200).json({
              status: true,
              data: {
                name: obj.name,
                email: obj.email,
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
        password: Joi.string().min(10).max(50).required(),
      });

      // validating request body again schema
      const { error: validationError } = schema.validate(body);
      if (!validationError) {
        const { email, password } = body;

        db.query(
          {
            sql: `SELECT
            email, password, mobile, name
          FROM
            users
          WHERE
            email = ?
          `,
            values: [email],
          },
          async (err, results: UserT[], fields) => {
            if (err) return next(new AppError(err.message, 403));

            if (results.length === 0)
              return next(new AppError("Incorrect email or password", 401));

            const user = results[0];
            if (await compare(password, user.password)) {
              const obj = Object.assign({}, user);
              delete obj.password;
              delete obj.mobile;

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
            } else
              return next(new AppError("Incorrect email or password", 401));
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
