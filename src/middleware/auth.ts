import asyncError from "./asyncError";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/userModel";
import { AuthenticatedRequest } from "../types/utils";
import { NextFunction, Request, Response } from "express";


export const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers["token"] as string;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Please login to use resources"
    })
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  const user = await User.findById(decodedData.id);
  console.log('user', user);

  if (user && user._id) {
    req.user = user
    next()
  } else {

    return res.status(400).json({
      success: false,
      message: "User not found "
    })
  }

};
