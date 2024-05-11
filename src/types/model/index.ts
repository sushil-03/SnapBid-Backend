import mongoose, { Types } from "mongoose";
import { UserType } from "../../models/userModel";
export type ProductType = {
  title: string;
  brand: string;
  description: string;
  timeToPay: number;
  allBidder: {
    _id?: Types.ObjectId;
    bidder: Types.ObjectId | UserType;
    bidAmount: number;
    paymentInfo: {
      status: "Prohibited" | "Pending" | "PaymentOnDelivery" | "Completed" | "Expired";
      paymentAt?: Date;
      paymentDeadline: Date | null;
      paymentAmount?: number;
    };
  }[];
  bidwinner?: mongoose.Types.ObjectId;
  enable_email: boolean;
  images: {
    filename: string;
    fileimage: string;
    _id?: string;
  }[];
  paymentReceived: boolean;
  category: string;
  owner: string;
  condition: string;
  startingBid: number;
  starting: Date;
  ending: Date;
  bidIncrement: number;
  paymentOption: "online" | "offline" | "both";
  maxBid: number;
  status: "Pending" | "Active" | "Transaction" | "PaymentOnDelivery" | "Completed" | "Expired";
  shippingInfo: "self" | "arrange";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  addressFrom: {
    state: string;
    city: string;
    country: string;
    pincode: string;
  };
  addressTo: {
    state: string;
    city: string;
    country: string;
    pincode: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;

}

export type OrderType = {
  seller: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  paymentMethod: "offline" | "online";
  product: mongoose.Types.ObjectId;
  orderDate: Date;
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
}


