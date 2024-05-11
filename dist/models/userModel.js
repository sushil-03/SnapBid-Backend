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
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
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
        validate: [validator_1.default.isEmail, "Please Enter a Valid Email"],
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
                type: mongoose_1.default.Schema.ObjectId,
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
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Product",
            },
        },
    ],
});
userSchema.index({ email: 1 }, { unique: true });
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password")) {
            next();
        }
        this.password = yield bcryptjs_1.default.hash(this.password, 10);
    });
});
userSchema.methods.getJWTToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};
userSchema.methods.comparePassword = function (originalPass, enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(originalPass, enteredPassword);
    });
};
exports.default = mongoose_1.default.model("User", userSchema);
