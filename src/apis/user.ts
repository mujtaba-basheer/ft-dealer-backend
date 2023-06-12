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
  role: number;
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

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      db.query(
        `
        SELECT
          u.name,
          email,
          r.title as role
        FROM
          (users as u
          LEFT JOIN (roles as r) ON (u.role = r.id));
        `,
        (err, results: UserT[], fields) => {
          if (err) {
            console.error(err);
            return next(new AppError(err.message, 403));
          }

          // sending response
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

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      type ReqBodyT = {
        name: string;
        role: number;
      };
      type ReqParamsT = {
        email: string;
      };
      const user = req.body as ReqBodyT;
      const { email } = req.params as ReqParamsT;

      // defining user schema
      const schema = Joi.object<ReqBodyT>({
        name: Joi.string().min(3).required(),
        role: Joi.number()
          .integer()
          .allow(...roles)
          .required(),
      });

      // validating request body again schema
      const { error: validationError } = schema.validate(user);
      if (!validationError && email) {
        // getting user to update
        const getUserQuery = `
        SELECT
          role
        FROM
          users
        WHERE
          email = "${email};"
        `;
        db.query(getUserQuery, (err, result: UserT[], fields) => {
          if (err) {
            console.error(err);
            return next(new AppError(err.message, 500));
          }
          // @ts-ignore
          else if (result.affectedRows === 0) {
            return next(
              new AppError(`User with email "${email}" not found!`, 404)
            );
          }

          // function to actually perform the update
          const performUpdate = () => {
            const { name, role } = user;

            const updateQuery = `
            UPDATE
              users
            SET
              name = ?,
              role = ?
            WHERE
              email = ?;
            `;

            db.query(
              {
                sql: updateQuery,
                values: [name, role, email],
              },
              (err, results, fields) => {
                if (err) {
                  console.error(err);
                  return next(new AppError(err.message, 403));
                }
                // @ts-ignore
                else if (results.affectedRows === 0) {
                  return next(
                    new AppError(`User with email "${email}" not found!`, 404)
                  );
                }

                // sending response
                res.status(200).json({
                  status: true,
                  msg: "User Updated Successfully",
                });
              }
            );
          };

          // if user type was admin and is now being set to some other role
          if (result[0].role === 1 && user.role !== 1) {
            const adminCountQuery = `
            SELECT
              COUNT(role) as admin_count
            FROM
              users
            WHERE
              role = 1;
            `;

            db.query(
              adminCountQuery,
              (err, result: { admin_count: number }[], fields) => {
                if (err) {
                  return next(new AppError(err.message, 500));
                }

                const [{ admin_count }] = result;
                if (admin_count === 1) {
                  return next(
                    new AppError(
                      "Unable to edit role as no other admin exists",
                      400
                    )
                  );
                }

                performUpdate();
              }
            );
          } else {
            performUpdate();
          }
        });
      } else {
        return next(new AppError(validationError.details[0].message, 400));
      }
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 501));
    }
  }
);
