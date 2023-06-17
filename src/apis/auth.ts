import { CookieOptions, NextFunction, Request, Response } from "express";
import { hash, compare } from "bcryptjs";
import * as Joi from "joi";
import { signToken } from "../utils/auth";
import AppError from "../utils/app-error";
import catchAsync from "../utils/catch-async";
import { config } from "dotenv";
import db from "../db";
import { decode, verify } from "jsonwebtoken";
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
      console.log(body);

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
                cookieOptions.domain = process.env.COOKIE_DOMAIN;
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

export const activate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      type ReqBody = {
        name: string;
        password: string;
        auth_token: string;
      };
      const body = req.body as ReqBody;

      // defining request body schema
      const schema = Joi.object<ReqBody>({
        name: Joi.string().required(),
        password: Joi.string().min(8).max(50).required(),
        auth_token: Joi.string().required(),
      });

      // validating request body again schema
      const { error: validationError } = schema.validate(body);
      if (!validationError) {
        const { name, auth_token, password } = body;
        verify(auth_token, process.env.JWT_SECRET, (err, decoded: UserT) => {
          if (err) return next(new AppError(err.message, 401));
          const { email } = decoded;
          db.query(
            {
              sql: `
            SELECT
              email, name, role
            FROM
              users
            WHERE
              email = ?
              AND status = "inactive";
          `,
              values: [email],
            },
            async (err, results: UserT[], fields) => {
              if (err) return next(new AppError(err.message, 403));

              if (results.length === 0)
                return next(new AppError("User not found", 404));

              // hashing password for security purpose
              const hashedPassword = await hash(password, 12);

              const user = results[0];

              const activateUserQuery = `
              UPDATE
                users
              SET
                password = "${hashedPassword}",
                status = "active",
                name = ?
              WHERE
                email = ?;
              `;
              db.query(
                {
                  sql: activateUserQuery,
                  values: [name, email],
                },
                (err, results) => {
                  if (err) return next(new AppError(err.message, 403));

                  const token = signToken({
                    email,
                    name: user.name,
                    role: user.role,
                  });

                  const cookieOptions: CookieOptions = {
                    expires: new Date(
                      Date.now() + +process.env.COOKIE_EXPIRES_IN
                    ),
                    path: "/",
                    sameSite: "none",
                    domain: "localhost",
                  };
                  if (process.env.NODE_ENV === "production") {
                    cookieOptions.httpOnly = true;
                    cookieOptions.domain = process.env.COOKIE_DOMAIN;
                    cookieOptions.secure = true;
                  }
                  res.cookie("jwt", token, cookieOptions);

                  // sending response
                  res.status(200).json({
                    status: true,
                    data: {
                      name: user.name,
                      email: user.email,
                    },
                    msg: "Account Activated Successfully",
                  });
                }
              );
            }
          );
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

export const logout = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const cookieOptions: CookieOptions = {
        expires: new Date(Date.now()),
        path: "/",
        sameSite: "none",
        domain: "localhost",
      };
      if (process.env.NODE_ENV === "production") {
        cookieOptions.httpOnly = true;
        cookieOptions.secure = true;
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
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
