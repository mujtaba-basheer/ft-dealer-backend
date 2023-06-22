import { Router } from "express";
import { addInventoryRecord, getAllTrailers } from "../apis/trailer";
import { protect } from "../middleware/auth";

const trailerRouter = Router();

// get all
trailerRouter.get("/", protect, getAllTrailers);

// add inventory record
trailerRouter.post("/inventory", protect, addInventoryRecord);

export default trailerRouter;
