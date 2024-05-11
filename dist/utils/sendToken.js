"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();
    return res.status(statusCode).json({
        success: true,
        user,
        token,
    });
};
exports.default = sendToken;
