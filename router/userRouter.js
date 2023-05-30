const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  loadUser,
} = require("../controller/userController");

const { isAuthenticated } = require("../middleware/auth");
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(isAuthenticated, logoutUser);
router.route("/me").get(isAuthenticated, loadUser);
module.exports = router;
