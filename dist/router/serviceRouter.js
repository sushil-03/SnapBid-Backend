"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const serviceController_1 = require("../controller/serviceController");
router.route("/service/otp").post(serviceController_1.generateOTP);
exports.default = router;
