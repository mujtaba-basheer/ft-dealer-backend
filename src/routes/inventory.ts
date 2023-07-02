import { Router } from "express";
import {
  addInventoryRecord,
  getSubmissions,
  getGlobalInventoryItems,
  getSubmissionsCSV,
} from "../apis/inventory";
import { protect, checkDealer } from "../middleware/auth";

const inventoryRouter = Router();

// get global inventory items
inventoryRouter.get("/", protect, checkDealer, getGlobalInventoryItems);

// add inventory record
inventoryRouter.post("/", protect, checkDealer, addInventoryRecord);

// get submissions
inventoryRouter.get("/submissions", protect, checkDealer, getSubmissions);

// get submissions csv
inventoryRouter.get(
  "/submissions-csv",
  protect,
  checkDealer,
  getSubmissionsCSV
);

export default inventoryRouter;
