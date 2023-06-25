import { Router } from "express";
import {
  addInventoryRecord,
  getFilledDates,
  getGlobalInventoryItems,
} from "../apis/inventory";
import { protect } from "../middleware/auth";

const inventoryRouter = Router();

// get global inventory items
inventoryRouter.get("/", protect, getGlobalInventoryItems);

// add inventory record
inventoryRouter.post("/", protect, addInventoryRecord);

// get submissions
inventoryRouter.get("/submissions", protect, getFilledDates);

export default inventoryRouter;
