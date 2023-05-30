"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const topics_1 = require("../apis/topics");
const auth_1 = require("../middleware/auth");
const topicRouter = (0, express_1.Router)();
// get all topics A2Z
topicRouter.get("/a2z", auth_1.checkLogin, topics_1.getTopicsA2Z);
// get all topics SDE
topicRouter.get("/sde", auth_1.checkLogin, topics_1.getTopicsSDE);
// update question progress
topicRouter.put("/progress", auth_1.protect, topics_1.updateProgress);
// update question note
topicRouter.put("/note", auth_1.protect, topics_1.updateNote);
exports.default = topicRouter;
