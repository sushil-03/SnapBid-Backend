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
exports.restartCronJob = exports.updateProductStatusOnSuccess = exports.generatePayment = exports.getProductById = exports.getAllProduct = exports.placeBid = exports.createProduct = void 0;
const asyncError_1 = __importDefault(require("../middleware/asyncError"));
const productModel_1 = __importDefault(require("../models/productModel"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const userModel_1 = __importDefault(require("../models/userModel"));
const stripe = require("stripe")(process.env.STRIPE_PUBLISHABLE_KEY);
const bidHandler_1 = require("../utils/bidHandler");
const orderController_1 = require("./orderController");
const createProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { brand, title, category, condition, description, endingDate, endingTime, startingDate, startingTime, startingBid, images, owner, timeToPay, starting, ending, paymentOption, shippingInfo, enable_email, addressFrom, bidIncrement, } = req.body;
    const user = yield userModel_1.default.findById({ _id: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }
    const product = yield productModel_1.default.create({
        brand,
        title,
        category,
        condition,
        timeToPay,
        description,
        endingDate,
        endingTime,
        startingDate,
        startingTime,
        startingBid,
        images,
        owner,
        starting,
        ending,
        paymentOption,
        addressFrom,
        shippingInfo,
        createdBy: req.user,
        bidIncrement,
        enable_email,
    });
    user.products.push({ product: product._id });
    yield user.save();
    const timestampEndingNotification = new Date(ending);
    const startingTimeStamp = new Date(starting);
    timestampEndingNotification.setMinutes(timestampEndingNotification.getMinutes() - 10);
    if (enable_email && startingTimeStamp < timestampEndingNotification) {
        console.log('Starting ending bid email at', timestampEndingNotification);
        node_schedule_1.default.scheduleJob(timestampEndingNotification, () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, bidHandler_1.sendBidEndingNotification)(product._id);
            console.log("email sent successfull");
        }));
    }
    node_schedule_1.default.scheduleJob(starting, () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, bidHandler_1.enableBidding)(product._id);
    }));
    node_schedule_1.default.scheduleJob(ending, () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, bidHandler_1.disableBidding)(product._id);
    }));
    res.status(201).json({
        message: "Good",
        product,
    });
});
exports.createProduct = createProduct;
const placeBid = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield productModel_1.default.findById({ _id: req.body.productId });
    if (!product) {
        return res.status(400).json({
            success: false,
            message: "Product not found"
        });
    }
    if (!req.user) {
        return res.status(400).json({
            success: false,
            message: "user not found"
        });
    }
    const user = req.user;
    if (product.status !== "Active") {
        return res.status(405).json({
            success: false,
            message: "Product is not active for bidding",
        });
    }
    if (product.maxBid >= req.body.amount) {
        return res.status(405).json({
            success: false,
            message: "Bid amount is less than current bid",
        });
    }
    if (user._id.toString() === product.createdBy._id.toString()) {
        return res.status(405).json({
            success: false,
            message: "Owner is not allowed to bid",
        });
    }
    if (product.ending.getTime() < Date.now()) {
        return res.status(405).json({
            success: false,
            message: "Time is up",
        });
    }
    const bidder = req.user;
    const bidAmount = req.body.amount;
    product.maxBid = bidAmount;
    const newbids = product.allBidder.filter((bid) => {
        return user._id.toString() !== bid.bidder._id.toString();
    });
    newbids.push({
        bidder: req.user._id, bidAmount,
        paymentInfo: {
            status: "Prohibited",
            paymentAt: undefined,
            paymentDeadline: null,
            paymentAmount: undefined
        },
    });
    product.allBidder = newbids;
    yield product.save();
    res.status(200).json({
        success: true,
        product,
    });
});
exports.placeBid = placeBid;
const getAllProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const st = new Date();
    let products;
    const page = parseInt(req.query.page) || 1;
    const category = req.query.category;
    const status = req.query.status;
    const limit = 10;
    const search = req.query.search;
    const skip = (page - 1) * limit;
    const searchObj = {};
    if (category && category !== "") {
        searchObj.category = category;
    }
    if (search && search !== "") {
        searchObj.$or = [
            { title: { $regex: new RegExp(search, "i") } },
            { description: { $regex: new RegExp(search, "i") } },
        ];
    }
    if (status && status !== "") {
        searchObj.status = status;
    }
    products = yield productModel_1.default.find(searchObj)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
        path: "createdBy",
        select: "avatar",
    });
    console.log('Time take to fetch all product', (new Date().getTime() - st.getTime()) / 1000);
    res.status(200).json({
        success: true,
        products,
    });
});
exports.getAllProduct = getAllProduct;
exports.getProductById = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield productModel_1.default.findById({ _id: req.params.id })
        .populate("createdBy")
        .populate("allBidder.bidder")
        .populate("bidwinner");
    if (!product) {
        return res.status(404).json({
            message: "Product not found",
        });
    }
    product.allBidder.sort((a, b) => b.bidAmount - a.bidAmount);
    res.status(200).json({
        product,
        success: true,
    });
}));
const generatePayment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, amount, type } = req.body;
    const paymentOption = type;
    const user = req.user;
    if (!user || user.selectedAddress < 0) {
        return res.status(404).json({
            message: "Please check your detail",
        });
    }
    const product = yield productModel_1.default.findOne({
        _id: productId,
        ending: { $lte: Date.now() },
    });
    if (!product) {
        return res.status(404).json({
            message: "Product not found",
        });
    }
    if (product.status === "Transaction") {
        for (const bidder of product.allBidder) {
            if (bidder.bidder._id.toString() === user._id.toString()) {
                if (!bidder.paymentInfo.paymentDeadline)
                    return;
                if (bidder.paymentInfo.paymentDeadline < new Date()) {
                    return res.status(404).json({
                        message: "Payment deadline is expired",
                    });
                }
                else {
                    if (paymentOption === "offline") {
                        bidder.paymentInfo.status = "PaymentOnDelivery";
                        bidder.paymentInfo.paymentAmount = bidder.bidAmount;
                        const winner = yield userModel_1.default.findById({ _id: bidder.bidder });
                        if (!winner) {
                            return res.status(400).json({
                                success: false,
                                message: 'Winner not found'
                            });
                        }
                        winner.bidWon.push({ product: product._id });
                        // !TODO Update product status
                        product.status = "PaymentOnDelivery";
                        const { country, city, state, pincode } = winner.address[winner.selectedAddress];
                        product.addressTo = {
                            country,
                            city,
                            state,
                            pincode,
                        };
                        product.bidwinner = bidder.bidder;
                        //  receiver, product, amount
                        const order = yield (0, orderController_1.createOrder)({
                            bidderId: bidder.bidder._id,
                            productId,
                            paymentMethod: "offline",
                            amount: bidder.bidAmount
                        });
                        if (order) {
                            yield product.save();
                            yield winner.save();
                            return res.status(200).json({
                                message: "Order created",
                                order,
                                success: true,
                            });
                        }
                        return res.status(400).json({
                            message: "Something went wrong ! ",
                            success: false,
                        });
                        //TODO Create order
                    }
                    else {
                        if (!bidder._id) {
                            return res.status(400).json({
                                success: false,
                                message: 'Bidder not found'
                            });
                        }
                        // Online Stripe Payment
                        const metadata = {
                            productId: productId,
                            bidder: bidder._id.toString(),
                        };
                        const price = yield stripe.prices.create({
                            currency: "inr",
                            unit_amount: bidder.bidAmount * 100,
                            product_data: {
                                name: product.title,
                                metadata,
                            },
                        });
                        const session = yield stripe.checkout.sessions.create({
                            payment_method_types: ["card"],
                            line_items: [
                                {
                                    price: price.id,
                                    quantity: 1,
                                },
                            ],
                            mode: "payment",
                            success_url: "https://snap-bid.vercel.app/explore/",
                            cancel_url: "https://snap-bid.vercel.app/",
                            metadata,
                            payment_intent_data: {
                                metadata,
                            },
                        });
                        return res.json({
                            id: session.id,
                        });
                    }
                }
            }
        }
    }
    return res.status(404).json({
        message: "Product payment time expired. ",
    });
});
exports.generatePayment = generatePayment;
const updateProductStatusOnSuccess = ({ productId, bidder, }) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield productModel_1.default.findOne({
        _id: productId,
        ending: { $lte: Date.now() },
    });
    if (!product) {
        return { success: false, message: "Product not found" };
    }
    const selectedBidder = product.allBidder.find((currBidder) => {
        return currBidder._id === bidder;
    });
    if (!selectedBidder) {
        return;
    }
    selectedBidder.paymentInfo.status = "Completed";
    selectedBidder.paymentInfo.paymentAt = new Date();
    selectedBidder.paymentInfo.paymentAmount = selectedBidder.bidAmount;
    const winner = yield userModel_1.default.findById({ _id: selectedBidder.bidder });
    if (!winner)
        return;
    winner.bidWon.push({ product: product._id });
    const seller = yield userModel_1.default.findById({ _id: product.createdBy });
    if (!seller)
        return;
    seller.revenue += selectedBidder.bidAmount;
    yield seller.save();
    // !TODO Update product status
    product.status = "Completed";
    const { country, city, state, pincode } = winner.address[winner.selectedAddress];
    product.addressTo = {
        country,
        city,
        state,
        pincode,
    };
    product.bidwinner = selectedBidder.bidder._id;
    product.paymentReceived = true;
    // await createOrder()
    yield (0, orderController_1.createOrder)({
        bidderId: selectedBidder.bidder._id,
        productId,
        paymentMethod: "online",
        amount: selectedBidder.bidAmount
    });
    yield product.save();
    yield winner.save();
    return;
});
exports.updateProductStatusOnSuccess = updateProductStatusOnSuccess;
// const getTimeInFormat = (time) => {
//   // const now = new Date();
//   return `${time.getHours()} : ${time.getMinutes()} :${time.getSeconds()}  `;
// };
function subtractTimes(time1, time2) {
    // Convert time strings to Date objects
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    // Calculate the time difference in milliseconds
    const differenceMs = date1.getTime() - date2.getTime();
    const newdate = new Date(differenceMs);
    const index = differenceMs / (30 * 60 * 1000);
    const rem = 30 * 60 * 100 - differenceMs;
    console.log("remainging time", rem, differenceMs, newdate);
    return Math.floor(index);
}
function addMinutesToDeadline(deadline, minutesToAdd) {
    // Convert deadline string to Date object
    const deadlineDate = new Date(deadline);
    // Add minutes to the deadline Date object
    deadlineDate.setMinutes(deadlineDate.getMinutes() + minutesToAdd);
    // Return the updated deadline Date object
    return deadlineDate.toISOString(); // Convert Date object back to ISO 8601 string
}
const restartCronJob = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("-------------------Restarting CRON JOB------------------");
    const products = yield productModel_1.default.find({
        status: { $in: ["Pending", "Active", "Transaction"] },
    }).populate("allBidder.bidder");
    const productLen = products.length;
    for (let i = 0; i < productLen; i++) {
        const currentTime = new Date();
        const product = products[i];
        console.log("FOR PRODUCT ID: ", product.title, product.status);
        const endingTime = new Date(product.ending);
        const totalTransactionTimeInMinutes = product.timeToPay * product.allBidder.length;
        const totalTransactionTime = endingTime.setMinutes(endingTime.getMinutes() + totalTransactionTimeInMinutes);
        // Status pending but should start bidding ->Active
        // Status pending but transaction should start ->Allow Pay
        // Status pending but transaction end -> Expired
        if (product.status === "Pending" && currentTime < product.ending) {
            if (currentTime < product.starting) {
                console.log("Started CRON JOB for starting bidding");
                node_schedule_1.default.scheduleJob(product.starting, () => __awaiter(void 0, void 0, void 0, function* () {
                    yield (0, bidHandler_1.enableBidding)(product._id);
                }));
                const timestampEndingNotification = new Date(product.ending);
                const startingTimeStamp = new Date(product.starting);
                timestampEndingNotification.setMinutes(timestampEndingNotification.getMinutes() - 10);
                if (product.enable_email &&
                    startingTimeStamp < timestampEndingNotification) {
                    console.log("Scheduling job for sending bid end notification");
                    node_schedule_1.default.scheduleJob(timestampEndingNotification, () => __awaiter(void 0, void 0, void 0, function* () {
                        yield (0, bidHandler_1.sendBidEndingNotification)(product._id);
                        console.log("email sent successfull");
                    }));
                }
            }
            else {
                console.log("Change product status to active");
                product.status = "Active";
                yield product.save();
                //TODO Apply sceduler till end time
                console.log("Started CRON JOB for ending bidding");
                node_schedule_1.default.scheduleJob(product.ending, () => __awaiter(void 0, void 0, void 0, function* () {
                    yield (0, bidHandler_1.disableBidding)(product._id);
                }));
            }
        }
        else if (product.status === "Active" && currentTime < product.ending) {
            console.log("Started CRON JOB for ending bidding");
            node_schedule_1.default.scheduleJob(product.ending, () => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, bidHandler_1.disableBidding)(product._id);
            }));
        }
        else {
            if (currentTime.getTime() < totalTransactionTime) {
                console.log("Change product status to transaction");
                product.status = "Transaction";
                const index = subtractTimes(currentTime, product.ending);
                console.log("Allow bidder of index to pay", index);
                const allBidder = product.allBidder.sort((a, b) => b.bidAmount - a.bidAmount) || [];
                allBidder[index].paymentInfo.status = "Pending";
                const deadline = addMinutesToDeadline(product.ending, (index + 1) * product.timeToPay);
                if (index != 0) {
                    allBidder[index - 1].paymentInfo.status = "Prohibited";
                }
                allBidder[index].paymentInfo.paymentDeadline = new Date(deadline);
                yield product.save();
                console.log("Started CRON JOB for next payment ");
                const newJob = node_schedule_1.default.scheduleJob(deadline, () => __awaiter(void 0, void 0, void 0, function* () {
                    yield (0, bidHandler_1.allowNextBidder)(product._id, index + 1, newJob);
                }));
            }
            else {
                console.log("EXPIRING PRODUCT");
                product.status = "Expired";
                yield product.save();
            }
        }
        // Status bidding(Active) but transaction should start
        // Status bidding(Active) but transaction end
        // Status transaction but should allow next bidder
        // Allow correct bidder
    }
    console.log("---------------ENDING---------------------");
});
exports.restartCronJob = restartCronJob;
