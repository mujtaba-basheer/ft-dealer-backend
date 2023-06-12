"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.checkAdmin = exports.checkLogin = exports.protect = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const app_error_1 = require("../utils/app-error");
const catch_async_1 = require("../utils/catch-async");
exports.protect = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const bearerToken = req.headers.authorization;
        let token;
        if (bearerToken && bearerToken.startsWith("Bearer ")) {
            token = bearerToken.split(" ")[1];
        }
        else if (req.cookies["jwt"]) {
            token = req.cookies["jwt"];
        }
        if (token) {
            (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET, (err, payload) => {
                if (err) {
                    if (err.name === "TokenExpiredError") {
                        const user = (0, jsonwebtoken_1.decode)(token);
                        req.user = user;
                        next();
                    }
                    else {
                        console.error(err);
                        throw new app_error_1.default("Token Invalid or Expired", 403);
                    }
                }
                else {
                    req.user = payload;
                    next();
                }
            });
        }
        else
            throw new Error("Unauthorized");
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 401));
    }
});
exports.checkLogin = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const bearerToken = req.headers.authorization;
        let token;
        if (bearerToken && bearerToken.startsWith("Bearer ")) {
            token = bearerToken.split(" ")[1];
        }
        else if (req.cookies["jwt"]) {
            token = req.cookies["jwt"];
        }
        if (token) {
            // token = decrypt(token);
            try {
                const user = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
                req.user = user;
                next();
            }
            catch (error) {
                console.error(error);
                next();
            }
        }
        else
            next();
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 401));
    }
});
exports.checkAdmin = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const { role } = req.user;
        if (role === 1)
            return next();
        throw new Error("Unauthorized!");
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 401));
    }
});
exports.validate = (0, catch_async_1.default)(async (req, res, next) => {
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
        }
        else
            throw new Error("Unauthorized");
    }
    catch (error) {
        return next(new app_error_1.default(error.message, error.statusCode || 401));
    }
});
