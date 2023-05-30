const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");

const bodyParser = require("body-parser");

app.use(cors());
app.use(cookieParser());
app.use(
  express.json({
    limit: "1000mb",
  })
);
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));

// Routes
const user = require("./router/userRouter");
// const video = require("./router/videoRouter");
app.use("/api/v1", user);
// app.use("/api/v1", video);
module.exports = app;
