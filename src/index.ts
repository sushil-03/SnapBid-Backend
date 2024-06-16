import express, { NextFunction } from "express";
import cors from "cors";
export const app = express();
import cookieParser from "cookie-parser";
import { Counter, Histogram } from 'prom-client'
require("dotenv").config({
  path: __dirname + "/config/config.env"
});

import bodyParser from "body-parser";
import { restartCronJob } from "./controller/productController";
import { Request, Response, } from 'express';



// Routes
import user from "./router/userRouter";
import product from "./router/productRouter";
import order from "./router/orderRouter";
import service from "./router/serviceRouter";
import metrics from "./router/metricsRouter";
import { connectDatabase } from "./config/config";
import { handleWebhook } from "./controller/webhookController";

app.use(cors());
app.use(cookieParser());

app.use(
  express.json({
    limit: "1000mb",
  })
);

const numberOfRequests = new Counter({
  name: 'http_request_count',
  help: 'Total number of requests',
  labelNames: ['method', 'route', 'status_code']
});
const histogram = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000, 1500, 2000, 3000]
});

// Middleware to increment the counter
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  res.on('finish', () => {
    const endTime = Date.now()
    const duration = endTime - startTime

    histogram.observe({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    }, duration);

    numberOfRequests.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    });
  });
  next();
});

(function () {
  restartCronJob();
})();


connectDatabase();
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));




app.post("/webhook", express.json({ type: "application/json" }), handleWebhook);
app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", service);
app.use("/api/v1", order);
app.use("/metrics", metrics);


app.use("/", (_req: Request, res: Response) => {
  res.json({
    message: "Server is up ",
  });
});
app.listen(8000, () => {
  console.log(`Server is running on PORT http://localhost:8000`);
});

// export default app
