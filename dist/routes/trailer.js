"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trailer_1 = require("../apis/trailer");
const auth_1 = require("../middleware/auth");
const trailerRouter = (0, express_1.Router)();
// get all
trailerRouter.get("/", auth_1.protect, trailer_1.getAllTrailers);
// add inventory record
trailerRouter.post("/inventory", auth_1.protect, trailer_1.addInventoryRecord);
exports.default = trailerRouter;
