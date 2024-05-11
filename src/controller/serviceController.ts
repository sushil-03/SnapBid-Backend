import { Request, Response } from "express";

import sendEmail from "../utils/sendEmail";
import { otpHTML } from "../templates/otpEmail";
export const generateOTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  //TODO Send email
  await sendEmail({
    to: email,
    subject: "Snapbid: OTP!",
    text: `Registration OTP`,
    html: otpHTML(OTP)
  }
  );

  return res.status(200).json({
    success: true,
    OTP,
  });
};
