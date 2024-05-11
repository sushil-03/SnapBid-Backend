import nodemailer from "nodemailer";
import { SEND_EMAIL } from "../types/utils";
const sendEmail = async ({ to, subject, text, html }: SEND_EMAIL) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAUTH2",
      user: "sushilrawat1720@gmail.com",
      clientId:
        "9991658429-p7jvrmooo2hdnfe9nh83djijposcrq1p.apps.googleusercontent.com",
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    },
    // host: "smtp.gmail.com",
    // port: 587,
    // secure: false,
    // auth: {
    //   user: process.env.NODEMAILERUSER,
    //   pass: process.env.NODEMAILERPASS,
    // },
  });
  try {
    const info = await transporter.sendMail({
      from: '"Snapbid 🛒 " <sushilrawat1720@gmail.com>',
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.log("Something went wrong while sending email", error);
  }
};

export default sendEmail;
