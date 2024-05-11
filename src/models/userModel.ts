import mongoose, { Types } from "mongoose";
import validator from "validator";
import jwt, { Jwt } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Document } from "mongoose";

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
    type: String,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  stripe_acc_id: {
    type: String,
  },

  revenue: {
    type: Number,
    default: 0,
  },
  bidWon: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    },
  ],
  contact: {
    type: String,
  },
  address: [
    {
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
  ],
  selectedAddress: {
    type: Number,
    default: -1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bankDetails: {
    account: {
      type: String,
    },
    ifsc: {
      type: String,
    },
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    },
  ],
});
userSchema.index({ email: 1 }, { unique: true });
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
  originalPass: string,
  enteredPassword: string
) {
  return await bcrypt.compare(originalPass, enteredPassword);
};

export interface UserType {
  _id: Types.ObjectId;
  firstname: string;
  lastname?: string;
  email: string;
  password: string;
  avatar: string;
  role: "admin" | "user";
  stripe_acc_id?: string;
  revenue: number;
  bidWon: {
    product: mongoose.Types.ObjectId;
  }[];
  contact?: string;
  address: {
    state: string;
    city: string;
    country: string;
    pincode: string;
  }[];
  selectedAddress: number;
  createdAt: Date;
  bankDetails?: {
    account?: string;
    ifsc?: string;
  };
  products: {
    product: mongoose.Types.ObjectId;
  }[];
}





export interface UserDocument extends UserType {
  comparePassword(originalPass: string, enteredPass: string): boolean;
  getJWTToken(): Jwt;
}

export default mongoose.model<UserDocument>("User", userSchema);
