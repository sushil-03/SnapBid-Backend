import { Router } from "express";
const router = Router();
import {
  registerUser,
  loginUser,
  logoutUser,
  loadUser,
  getSingleUser,
  updateProfile,
} from "../controller/userController";

import { isAuthenticated } from "../middleware/auth";
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(isAuthenticated, logoutUser);
router.route("/user/:id").get(getSingleUser);
router.route("/user").put(isAuthenticated, updateProfile);
router.route("/me").get(isAuthenticated, loadUser);

export default router;
