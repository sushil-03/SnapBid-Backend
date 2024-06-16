import Order from "../models/orderModel";
import Product from "../models/productModel";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/utils";
import { ObjectId, Types } from "mongoose";

type CREATE_ORDER = {
  bidderId: Types.ObjectId,
  productId: Types.ObjectId,
  paymentMethod: 'online' | 'offline',
  // paymentMethod:string,
  amount: number
}


export const createOrder = async ({ bidderId, productId, paymentMethod, amount }: CREATE_ORDER) => {
  const product = await Product.findById({ _id: productId });
  if (!product) {
    return;
  }
  const order = await Order.create({
    seller: product.createdBy,
    buyer: bidderId,
    product: productId,
    totalAmount: amount,
    paymentMethod,
    orderDate: Date.now(),
  });

  return order;
};
export const fetchOrderByUserType = async (req: AuthenticatedRequest, res: Response) => {
  const { userType } = req.query;
  if (!req.user) {
    return res.status(400).json({
      success: false,
      message: "User not found"
    })
  }
  if (userType === "seller") {
    const orders = await Order.find({ seller: req.user._id })
      .populate("seller")
      .populate("buyer")
      .populate("product");
    return res.status(200).json({
      success: true,
      orders,
    });
  } else if (userType === "buyer") {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("product")
      .populate("buyer")
      .populate("seller");
    return res.status(200).json({
      success: true,
      orders,
    });
  } else if (req.user.role === "admin") {
    const orders = await Order.find({ buyer: req.user._id });
    return res.status(200).json({
      success: true,
      orders,
    });
  }

  return res.status(400).json({
    success: false,
    message: "Not authorized",
  });
};
export const updateOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { payment_status, order_status, orderId } = req.body;
  const order = await Order.findById({ _id: orderId })
    .populate("seller")
    .populate("buyer");
  if (!order) {
    return res.status(400).json({
      success: false,
      message: "Order not found"
    })
  }
  const product = await Product.findById({ _id: order.product });
  if (!product) {
    return res.status(400).json({
      success: false,
      message: "Product not found"
    })
  }
  if (!req.user) {
    return res.status(400).json({
      success: false,
      message: "Please login"
    })
  }
  const user = req.user._id;
  if (user.toString() === product.createdBy.toString()) {
    order.status = order_status;
    product.paymentReceived = payment_status;
      if (payment_status === true) {
      product.status = "Completed"
    } else {
      product.status = "PaymentOnDelivery"
    }
    await order.save();
    await product.save();
    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
    });
  }
  return res.status(400).json({
    success: false,
    message: "Bidder can't update status ",
  });
};
