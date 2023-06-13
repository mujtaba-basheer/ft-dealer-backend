import * as crypto from "crypto";
import { compare } from "bcryptjs";
import * as https from "https";
import * as jwt from "jsonwebtoken";
import { config } from "dotenv";
import rs = require("randomstring");
import base64url from "base64url";
config();

type StoreItem = {
  code_verifier: string;
  state: string;
  __ms: string;
  memberstack: string;
};
type UserObj = {
  name: string;
  email: string;
  role: number;
};

const store: StoreItem[] = [
  {
    code_verifier: "",
    state: "",
    __ms: "",
    memberstack: "",
  },
];

// sign jwt token
export const signToken: (user: UserObj & any) => string = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// create send token
export const createSendToken = (
  user,
  statusCode: number,
  req: Express.Request,
  res: Express.Response
) => {
  // const token = signToken(user._id);
  // res.cookie("jwt", token, {
  //   expires: new Date(
  //     Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  //   ),
  //   httpOnly: true,
  //   secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  // });
  // // Remove password from output
  // user.password = undefined;
  // res.json({
  //   status: "success",
  //   token,
  //   data: {
  //     user,
  //   },
  // });
};

export const comparePassword: (
  storedPass: string,
  enteredPass: string
) => Promise<boolean> = (storedPass, enteredPass) => {
  return compare(storedPass, enteredPass);
};
