"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = ({ to, subject, text, html }) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            type: "OAUTH2",
            user: "sushilrawat1720@gmail.com",
            clientId: "9991658429-p7jvrmooo2hdnfe9nh83djijposcrq1p.apps.googleusercontent.com",
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
        const info = yield transporter.sendMail({
            from: '"Snapbid 🛒 " <sushilrawat1720@gmail.com>',
            to,
            subject,
            text,
            html,
        });
    }
    catch (error) {
        console.log("Something went wrong while sending email", error);
    }
});
exports.default = sendEmail;
