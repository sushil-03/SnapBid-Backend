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
exports.getSingleUser = exports.loadUser = exports.getAllUser = exports.updateProfile = exports.getUserDetails = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const asyncError_1 = __importDefault(require("../middleware/asyncError"));
const userModel_1 = __importDefault(require("../models/userModel"));
const sendToken_1 = __importDefault(require("../utils/sendToken"));
var mongoose = require("mongoose");
//Register a User
exports.registerUser = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstname, lastname, email, password, avatar } = req.body;
    const userExist = yield userModel_1.default.findOne({ email });
    if (userExist) {
        return res.status(400).json({
            success: false,
            message: "User Already Exist",
        });
    }
    const user = yield userModel_1.default.create({
        firstname,
        lastname,
        email,
        avatar,
        password,
    });
    (0, sendToken_1.default)(user, 201, res);
}));
// log in
exports.loginUser = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please Enter Email and Password"
        });
    }
    const user = yield userModel_1.default.findOne({ email }).select("+password");
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }
    const isPasswordMatch = user.comparePassword(password, user.password);
    if (!isPasswordMatch) {
        return res.status(401).json({
            success: false,
            message: "Not match email or password"
        });
    }
    (0, sendToken_1.default)(user, 200, res);
}));
//LogOut user
exports.logoutUser = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    return res.status(200).json({
        success: true,
        message: "Logged Out successfully",
    });
}));
//Get User details
exports.getUserDetails = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "UserId is missing",
        });
    }
    const user = yield userModel_1.default.findById(userId);
    res.status(200).json({
        success: true,
        user,
    });
}));
//Update User Profile
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(400).json({
            sucess: false,
            message: "Relogin again"
        });
        return;
    }
    console.log('get2');
    const data = req.body;
    const user = yield userModel_1.default.findByIdAndUpdate(req.user._id, data, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    (0, sendToken_1.default)(user, 200, res);
});
exports.updateProfile = updateProfile;
//Get all user
exports.getAllUser = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield userModel_1.default.find();
    res.status(200).json({
        success: true,
        users,
    });
}));
//Get single user
const loadUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user)
        return;
    const user = yield userModel_1.default.findById(req.user._id);
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User not found"
        });
    }
    res.status(200).json({
        success: true,
        user,
    });
});
exports.loadUser = loadUser;
exports.getSingleUser = (0, asyncError_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (isValid) {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: "userid is missing",
            });
        }
        const user = yield userModel_1.default.findById(req.params.id)
            .populate("products.product")
            .populate("bidWon.product").populate({
            path: "products.product.createdBy",
            select: "avatar",
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User must login first"
            });
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
}));
