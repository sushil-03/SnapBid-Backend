import AsyncError from "../middleware/asyncError";
import User from "../models/userModel";
import sendToken from "../utils/sendToken";
import { AuthenticatedRequest } from "../types/utils";
import { NextFunction, Response } from "express";
var mongoose = require("mongoose");
//Register a User
export const registerUser = AsyncError(async (req, res, next) => {
  const { firstname, lastname, email, password, avatar } = req.body;
  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(400).json({
      success: false,
      message: "User Already Exist",
    });
  }
  const user = await User.create({
    firstname,
    lastname,
    email,
    avatar,
    password,
  });
  sendToken(user, 201, res);
});

// log in
export const loginUser = AsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please Enter Email and Password"
    })
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    })
  }
  const isPasswordMatch = user.comparePassword(password, user.password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: "Not match email or password"
    })
  }
  sendToken(user, 200, res);
});

//LogOut user
export const logoutUser = AsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  return res.status(200).json({
    success: true,
    message: "Logged Out successfully",
  });
});

//Get User details
export const getUserDetails = AsyncError(async (req, res, next) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "UserId is missing",
    });
  }
  const user = await User.findById(userId);

  res.status(200).json({
    success: true,
    user,
  });
});

//Update User Profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

  if (!req.user) {

    res.status(400).json({
      sucess: false,
      message: "Relogin again"
    })
    return;
  }
  console.log('get2');


  const data = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, data, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });


  sendToken(user, 200, res);
};
//Get all user
export const getAllUser = AsyncError(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

//Get single user
export const loadUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) return
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found"
    })
  }
  res.status(200).json({
    success: true,
    user,
  });
};
export const getSingleUser = AsyncError(async (req, res,) => {
  const id = req.params.id;
  const isValid = mongoose.Types.ObjectId.isValid(id);

  if (isValid) {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: "userid is missing",
      });
    }
    const user = await User.findById(req.params.id)
      .populate("products.product")
      .populate("bidWon.product").populate({
        path: "products.product.createdBy",
        select: "avatar",
      });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User must login first"
      })
    }

    return res.status(200).json({
      success: true,
      user,
    });
  }
  return res.status(400).json({
    success: false,
    message: "Invalid  userId",
  });
});
