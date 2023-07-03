"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const announcement_1 = require("../apis/announcement");
const auth_1 = require("../middleware/auth");
const announcementRouter = (0, express_1.Router)();
// add a new announcement
announcementRouter.post("/", auth_1.protect, auth_1.checkAdmin, announcement_1.addAnnouncement);
// delete authenticated user's announcement
announcementRouter.delete("/", auth_1.protect, auth_1.checkAdmin, announcement_1.deleteMyAnnouncement);
// get authenticated user's announcement
announcementRouter.get("/", auth_1.protect, auth_1.checkAdmin, announcement_1.fetchMyAnnouncement);
// get all announcements
announcementRouter.get("/all", auth_1.protect, auth_1.checkDealer, announcement_1.fetchAllAnnouncements);
exports.default = announcementRouter;
