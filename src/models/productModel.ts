import mongoose from "mongoose";
import { ProductType } from "../types/model";



const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter your name"],
    trim: true,
  },
  brand: {
    type: String,
    required: [true, "Please enter your brand"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please enter product description "],
    trim: true,
  },
  timeToPay: {
    type: Number,
    default: 30,
  },

  allBidder: [
    {
      bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      bidAmount: {
        require: true,
        type: Number,
      },
      paymentInfo: {
        status: {
          type: String,
          enum: [
            "Prohibited",
            "Pending",
            "PaymentOnDelivery",
            "Completed",
            "Expired",
          ],
          default: "Prohibited",
        },
        paymentAt: {
          type: Date,
        },
        paymentDeadline: {
          type: Date,
        },
        paymentAmount: {
          type: Number,
        },
      },
    },
  ],
  bidwinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  enable_email: {
    type: Boolean,
    default: false,
  },
  images: [
    {
      filename: {
        type: String,
        required: true,
      },
      fileimage: {
        type: String,
        required: true,
      },
      _id: {
        type: String,
      },
    },
  ],
  paymentReceived: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    required: [true, "Please enter product category "],
  },
  owner: {
    type: String,
    required: [true, "Please enter product category "],
  },
  condition: {
    type: String,
    required: [true, "Please enter product category "],
  },
  startingBid: {
    type: Number,
    required: [true, "Please enter product startingBid "],
  },
  starting: {
    type: Date,
    required: [true, "Please enter product starting Date "],
  },
  ending: {
    type: Date,
    required: [true, "Please enter product starting Date "],
  },
  bidIncrement: {
    type: Number,
    default: 0,
  },
  paymentOption: {
    type: String,
    enum: ["online", "offline", "both"],
    required: true,
  },
  maxBid: {
    type: Number,
  },
  status: {

    type: String,
    enum: [
      "Pending",
      "Active",
      "Transaction",
      "PaymentOnDelivery",
      "Completed",
      "Expired",
    ],
    default: "Pending",
  },
  shippingInfo: {
    type: String,
    enum: ["self", "arrange"],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  addressFrom: {
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
  },
  addressTo: {
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
  },
});
productSchema.pre("save", function (next) {
  if (!this.maxBid) {
    this.maxBid = this.startingBid;
  }
  next()
})







export default mongoose.model<ProductType>("Product", productSchema);
