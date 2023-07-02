"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_1 = require("../apis/inventory");
const auth_1 = require("../middleware/auth");
const inventoryRouter = (0, express_1.Router)();
// get global inventory items
inventoryRouter.get("/", auth_1.protect, auth_1.checkDealer, inventory_1.getGlobalInventoryItems);
// add inventory record
inventoryRouter.post("/", auth_1.protect, auth_1.checkDealer, inventory_1.addInventoryRecord);
// get submissions
inventoryRouter.get("/submissions", auth_1.protect, auth_1.checkDealer, inventory_1.getSubmissions);
// get submissions csv
inventoryRouter.get("/submissions-csv", auth_1.protect, auth_1.checkDealer, inventory_1.getSubmissionsCSV);
exports.default = inventoryRouter;
