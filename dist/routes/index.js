"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trailerRouter = exports.userRouter = exports.authRouter = void 0;
const auth_1 = require("./auth");
exports.authRouter = auth_1.default;
const user_1 = require("./user");
exports.userRouter = user_1.default;
const trailer_1 = require("./trailer");
exports.trailerRouter = trailer_1.default;
