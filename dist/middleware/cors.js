"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const allowed_origins = ["https://umrit.in", "https://takeuforward.org"];
const cors = () => {
    return function (req, res, next) {
        const origin = req.headers.origin;
        try {
            res.setHeader("Access-Control-Allow-Origin", "*"
            // allowed_origins.includes(origin) ? origin : allowed_origins[0]
            );
            // res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.setHeader("Access-Control-Allow-Credentials", "true");
            next();
        }
        catch (error) {
            console.error(error);
            next();
        }
    };
};
exports.default = cors;
