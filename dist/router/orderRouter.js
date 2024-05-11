"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controller/orderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.route("/order").get(auth_1.isAuthenticated, orderController_1.fetchOrderByUserType);
router.route("/order").post(auth_1.isAuthenticated, orderController_1.updateOrder);
exports.default = router;
