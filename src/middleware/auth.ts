import { Request, Response, NextFunction } from "express";
import { decode, Jwt, JwtPayload, Secret, verify } from "jsonwebtoken";
import { getUserDetails } from "../utils/user";
import AppError from "../utils/app-error";
import catchAsync from "../utils/catch-async";

type UserT = {
  name: string;
  email: string;
  password: string;
  role: number;
};

export const protect = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const bearerToken = req.headers.authorization;
      let token: string;
      if (bearerToken && bearerToken.startsWith("Bearer ")) {
        token = bearerToken.split(" ")[1];
      } else if (req.cookies["jwt"]) {
        token = req.cookies["jwt"];
      }
      if (token) {
        verify(token, process.env.JWT_SECRET, (err, payload) => {
          if (err) {
            if (err.name === "TokenExpiredError") {
              const user = decode(token) as JwtPayload as UserT;
              req.user = user;
              next();
            } else {
              console.error(err);
              throw new AppError("Token Invalid or Expired", 403);
            }
          } else {
            req.user = payload as UserT;
            next();
          }
        });
      } else throw new Error("Unauthorized");
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 401));
    }
  }
);

export const checkLogin = catchAsync(
  async (req: Request & { user: any }, res: Response, next: NextFunction) => {
    try {
      const bearerToken = req.headers.authorization;
      let token: string;
      if (bearerToken && bearerToken.startsWith("Bearer ")) {
        token = bearerToken.split(" ")[1];
      } else if (req.cookies["jwt"]) {
        token = req.cookies["jwt"];
      }
      if (token) {
        // token = decrypt(token);
        try {
          const user = verify(token, process.env.JWT_SECRET);
          req.user = user;
          next();
        } catch (error) {
          console.error(error);
          next();
        }
      } else next();
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 401));
    }
  }
);

export const checkAdmin = catchAsync(
  async (req: Request & { user: UserT }, res: Response, next: NextFunction) => {
    try {
      const { role } = req.user;
      if (role === 1) return next();
      throw new Error("Unauthorized!");
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 401));
    }
  }
);

export const validate = catchAsync(
  async (req: Request & { user: any }, res: Response, next: NextFunction) => {
    try {
      const bearerToken = req.headers.authorization;
      if (bearerToken && bearerToken.startsWith("Bearer ")) {
        const unparsed_token = bearerToken.split(" ")[1];
        let [mid, token] = unparsed_token.split(".");
        // token = decrypt(token);
        const user = { data: { mid } };
        req.headers.authorization = token;
        req.user = user;
        next();
      } else throw new Error("Unauthorized");
    } catch (error) {
      return next(new AppError(error.message, error.statusCode || 401));
    }
  }
);
