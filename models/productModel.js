const mongoose = require("mongoose");

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
  maxBid: {
    type: Number,
    default: function () {
      return this.startingBid;
    },
  },
  allBidder: [
    {
      bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      bidAmount: {
        type: Number,
      },
    },
  ],
  bidwinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  location: {
    type: String,
    required: [true, "Please enter product category "],
  },
  startingBid: {
    type: Number,
    required: [true, "Please enter product startingBid "],
  },
  startingDate: {
    type: Date,
    required: [true, "Please enter product starting Date "],
  },
  endingDate: {
    type: Date,
    required: [true, "Please enter product ending Date "],
  },
  startingTime: {
    type: Date,
    required: [true, "Please enter product starting Time "],
  },
  endingTime: {
    type: Date,
    required: [true, "Please enter product ending Time "],
  },
  paymentInfo: {
    type: String,
    enum: ["Online Payment", "Cash on Delivery", "POS on Delivery"],
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Active", "Completed"],
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
});

module.exports = mongoose.model("Product", productSchema);
