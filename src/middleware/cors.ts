import { Request, Response, NextFunction } from "express";

const allowed_origins = ["https://dealerportal.webflow.io"];

const cors = () => {
  return function (req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    try {
      res.setHeader(
        "Access-Control-Allow-Origin",
        process.env.NODE_ENV === "development"
          ? "https://dealerportal.webflow.io"
          : allowed_origins.includes(origin)
          ? origin
          : allowed_origins[0]
      );
      // res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      next();
    } catch (error) {
      console.error(error);
      next();
    }
  };
};

export default cors;
