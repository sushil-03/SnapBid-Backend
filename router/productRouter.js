const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProduct,
  getProductById,
  placeBid,
} = require("../controller/productController");

const { isAuthenticated } = require("../middleware/auth");
router.route("/create").post(isAuthenticated, createProduct);
router.route("/products").get(getAllProduct);
router.route("/product/:id").get(getProductById);
router.route("/bid").post(isAuthenticated, placeBid);
module.exports = router;
