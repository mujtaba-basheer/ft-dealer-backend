import * as express from "express";
import * as cookieParser from "cookie-parser";
import { config } from "dotenv";
import {
  authRouter,
  userRouter,
  trailerRouter,
  inventoryRouter,
  announcementRouter,
} from "./routes/index";

// importing middleware handlers
import { notFound, errorHandler } from "./middleware/error.js";
import cors from "./middleware/cors";
config();

const app = express();
app.options("*", cors());
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/trailer", trailerRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/announcement", announcementRouter);

// test endpoint
app.get("/*", (req: express.Request, res: express.Response) => {
  res.send("API is running...\n");
});

app.use(notFound);
app.use(errorHandler);

// spinning up the server
const port = process.env.PORT || 5000;
const server = app.listen(port, () =>
  console.log(`Server running in ${process.env.NODE_ENV} on port ${port}...`)
);

process.on("unhandledRejection", (err: { name: string; message: string }) => {
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
