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
exports.updateOrder = exports.fetchOrderByUserType = exports.createOrder = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const productModel_1 = __importDefault(require("../models/productModel"));
const createOrder = ({ bidderId, productId, paymentMethod, amount }) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield productModel_1.default.findById({ _id: productId });
    if (!product) {
        return;
    }
    const order = yield orderModel_1.default.create({
        seller: product.createdBy,
        buyer: bidderId,
        product: productId,
        totalAmount: amount,
        paymentMethod,
        orderDate: Date.now(),
    });
    return order;
});
exports.createOrder = createOrder;
const fetchOrderByUserType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userType } = req.query;
    if (!req.user) {
        return res.status(400).json({
            success: false,
            message: "User not found"
        });
    }
    if (userType === "seller") {
        const orders = yield orderModel_1.default.find({ seller: req.user._id })
            .populate("seller")
            .populate("buyer")
            .populate("product");
        return res.status(200).json({
            success: true,
            orders,
        });
    }
    else if (userType === "buyer") {
        const orders = yield orderModel_1.default.find({ buyer: req.user._id })
            .populate("product")
            .populate("buyer")
            .populate("seller");
        return res.status(200).json({
            success: true,
            orders,
        });
    }
    else if (req.user.role === "admin") {
        const orders = yield orderModel_1.default.find({ buyer: req.user._id });
        return res.status(200).json({
            success: true,
            orders,
        });
    }
    return res.status(400).json({
        success: false,
        message: "Not authorized",
    });
});
exports.fetchOrderByUserType = fetchOrderByUserType;
const updateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { payment_status, order_status, orderId } = req.body;
    const order = yield orderModel_1.default.findById({ _id: orderId })
        .populate("seller")
        .populate("buyer");
    if (!order) {
        return res.status(400).json({
            success: false,
            message: "Order not found"
        });
    }
    const product = yield productModel_1.default.findById({ _id: order.product });
    if (!product) {
        return res.status(400).json({
            success: false,
            message: "Product not found"
        });
    }
    if (!req.user) {
        return res.status(400).json({
            success: false,
            message: "Please login"
        });
    }
    const user = req.user._id;
    if (user.toString() === product.createdBy.toString()) {
        order.status = order_status;
        product.paymentReceived = payment_status;
        yield order.save();
        yield product.save();
        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
        });
    }
    return res.status(400).json({
        success: false,
        message: "Bidder can't update status ",
    });
});
exports.updateOrder = updateOrder;
