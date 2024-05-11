import { Router } from "express";
const router = Router();
import {
  createProduct,
  getAllProduct,
  getProductById,
  placeBid,
  generatePayment,
} from "../controller/productController";

import { isAuthenticated } from "../middleware/auth";
router.route("/create").post(isAuthenticated, createProduct);
router.route("/products").get(getAllProduct);
router.route("/product/:id").get(getProductById);
router.route("/bid").post(isAuthenticated, placeBid);
router.route("/product/pay").post(isAuthenticated, generatePayment);
export default router;
