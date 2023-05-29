import { Router } from "express";
import {
  getTopicsA2Z,
  getTopicsSDE,
  updateProgress,
  updateNote,
} from "../apis/topics";
import { admin, protect, checkLogin } from "../middleware/auth";

const topicRouter = Router();

// get all topics A2Z
topicRouter.get("/a2z", checkLogin, getTopicsA2Z);

// get all topics SDE
topicRouter.get("/sde", checkLogin, getTopicsSDE);

// update question progress
topicRouter.put("/progress", protect, updateProgress);

// update question note
topicRouter.put("/note", protect, updateNote);

export default topicRouter;
