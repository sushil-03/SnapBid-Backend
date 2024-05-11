import mongoose from "mongoose";
export type OrderType = {
  seller: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  paymentMethod?: "offline" | "online";
  product: mongoose.Types.ObjectId;
  orderDate?: Date;
  totalAmount: number;
  status?: "pending" | "processing" | "shipped" | "delivered" | "canceled";
}
const orderSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  paymentMethod: {
    type: "string",
    enum: ["offline", "online"],
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "canceled"],
    default: "pending",
  },
});

export default mongoose.model<OrderType>("Order", orderSchema);

