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

  images: [
    {
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: string,
    required: [true, "Please enter product category "],
  },
  owner: {
    type: string,
    required: [true, "Please enter product category "],
  },
  condition: {
    type: string,
    required: [true, "Please enter product category "],
  },
  location: {
    type: string,
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
  payment: {
    type: String,
    enum: ["Online Payment", "Cash on Delivery", "POS on Delivery"],
    required: true,
  },
  shipping: {
    type: String,
    enum: ["self", "arrange"],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
userSchema.methods.comparePassword = async function (
  originalPass,
  enteredPassword
) {
  return await bcrypt.compare(originalPass, enteredPassword);
};
module.exports = mongoose.model("User", userSchema);
