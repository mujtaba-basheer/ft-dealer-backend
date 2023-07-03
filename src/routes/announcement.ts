import { Router } from "express";
import {
  addAnnouncement,
  fetchAllAnnouncements,
  fetchMyAnnouncement,
  deleteMyAnnouncement,
} from "../apis/announcement";
import { checkAdmin, checkDealer, protect } from "../middleware/auth";

const announcementRouter = Router();

// add a new announcement
announcementRouter.post("/", protect, checkAdmin, addAnnouncement);

// delete authenticated user's announcement
announcementRouter.delete("/", protect, checkAdmin, deleteMyAnnouncement);

// get authenticated user's announcement
announcementRouter.get("/", protect, checkAdmin, fetchMyAnnouncement);

// get all announcements
announcementRouter.get("/all", protect, checkDealer, fetchAllAnnouncements);

export default announcementRouter;
