import { Router } from "express";
const router = Router();
import { generateOTP, } from "../controller/serviceController";

router.route("/service/otp").post(generateOTP);
export default router;
