const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProduct,
  getProductById,
  placeBid,
  generatePayment,
} = require("../controller/productController");

const { isAuthenticated } = require("../middleware/auth");
router.route("/create").post(isAuthenticated, createProduct);
router.route("/products").get(getAllProduct);
router.route("/product/:id").get(getProductById);
router.route("/bid").post(isAuthenticated, placeBid);
router.route("/product/pay").post(isAuthenticated, generatePayment);
module.exports = router;
