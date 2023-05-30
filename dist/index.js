"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv_1 = require("dotenv");
const index_1 = require("./routes/index");
// importing middleware handlers
const error_js_1 = require("./middleware/error.js");
const cors_1 = require("./middleware/cors");
(0, dotenv_1.config)();
const app = express();
app.options("*", (0, cors_1.default)());
app.use((0, cors_1.default)());
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
if (process.env.NODE_ENV === "development") {
    const morgan = require("morgan");
    app.use(morgan("dev"));
}
app.use("/api/auth", index_1.authRouter);
app.use("/api/user", index_1.userRouter);
app.use("/api/topic", index_1.topicRouter);
// test endpoint
app.get("/*", (req, res) => {
    res.send("API is running...\n");
});
app.use(error_js_1.notFound);
app.use(error_js_1.errorHandler);
// spinning up the server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => console.log(`Server running in ${process.env.NODE_ENV} on port ${port}...`));
process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
process.on("SIGTERM", () => {
    console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
        console.log("💥 Process terminated!");
    });
});
