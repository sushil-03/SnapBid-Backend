import express from "express";
import cors from "cors";
export const app = express();
import cookieParser from "cookie-parser";
require("dotenv").config({
  path: __dirname + "/config/config.env"
});
require('newrelic');
import bodyParser from "body-parser";
import connectDatabase from './config/datatbase'
import { v2 as cloudinary } from "cloudinary";
import { updateProductStatusOnSuccess, restartCronJob } from "./controller/productController";
import { Request, Response, } from 'express';



// Routes
import user from "./router/userRouter";

import product from "./router/productRouter";
import order from "./router/orderRouter";
import service from "./router/serviceRouter";
app.use(cors());
app.use(cookieParser());

app.use(
  express.json({
    limit: "1000mb",
  })
);
(function () {
  restartCronJob();
})();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
connectDatabase();
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));





app.post(
  "/webhook",
  express.json({ type: "application/json" }),
  async (request, response) => {
    const event = request.body;
    console.log('event called',event);

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        await updateProductStatusOnSuccess(paymentIntent.metadata);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    response.json({ received: true });
  }
);
app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", service);
app.use("/api/v1", order);

app.use("/", (_req: Request, res: Response) => {
  res.json({
    message: "Server is up ",
  });
});
app.listen(8000, () => {
  console.log(`Server is running on PORT http://localhost:8000`);
});

// export default app
