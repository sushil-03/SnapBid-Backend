const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [30, "Name should be less than 30 character"],
    minLength: [3, "Name should be more than 3 character"],
    trim: true,
  },
  lastname: {
    type: String,
    maxLength: [30, "Name should be less than 30 character"],
    minLength: [3, "Name should be more than 3 character"],
    trim: true,
  },

  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please Enter a Valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter Your Password"],
    maxlength: [30, "Password should be less than 8 character"],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  country: {
    type: String,
    trim: true,
    required: [true, "Please Enter Your Country"],
  },
  pincode: {
    type: String,
    trim: true,
    required: [true, "Please Enter Your pin code"],
  },
  state: {
    type: String,
    trim: true,
    required: [true, "Please Enter Your pin code"],
  },
  contact: {
    type: String,
    required: [true, "Please Enter Your Phone number"],
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
