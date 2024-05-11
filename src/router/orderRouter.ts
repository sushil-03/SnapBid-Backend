import { Router } from "express";
import {
  fetchOrderByUserType,
  updateOrder,
} from "../controller/orderController";
import { isAuthenticated } from "../middleware/auth";
const router = Router();

router.route("/order").get(isAuthenticated, fetchOrderByUserType);
router.route("/order").post(isAuthenticated, updateOrder);
export default router;
