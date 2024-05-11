import { Response } from "express";
const sendToken = (user: any, statusCode: number, res: Response) => {
  const token = user.getJWTToken();

  return res.status(statusCode).json({
    success: true,
    user,
    token,
  });
};

export default sendToken;
