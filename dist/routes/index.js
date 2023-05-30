"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topicRouter = exports.userRouter = exports.authRouter = void 0;
const auth_1 = require("./auth");
exports.authRouter = auth_1.default;
const user_1 = require("./user");
exports.userRouter = user_1.default;
const topics_1 = require("./topics");
exports.topicRouter = topics_1.default;
