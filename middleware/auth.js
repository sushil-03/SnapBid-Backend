const ErrorHandler = require("../utils/errorHandler");
const asyncError = require("./asyncError");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticated = asyncError(async (req, res, next) => {
  const token = req.headers["token"];
  if (!token) {
    return next(new ErrorHandler("Please login to access the resource"), 401);
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decodedData.id);
  console.log("checking user ", req.user);
  next();
});
