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
exports.sendBidEndingNotification = exports.allowNextBidder = exports.disableBidding = exports.enableBidding = void 0;
const productModel_1 = __importDefault(require("../models/productModel"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const bidEndingEmail_1 = require("../templates/bidEndingEmail");
const sendEmail_1 = __importDefault(require("./sendEmail"));
const bidPaymentEmail_1 = require("../templates/bidPaymentEmail");
const enableBidding = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Bidding Started");
    const product = yield productModel_1.default.findById(productId);
    if (!product) {
        return;
    }
    product.status = "Active";
    yield product.save();
});
exports.enableBidding = enableBidding;
const getCurrTime = () => {
    const now = new Date();
    return `${now.getHours()} : ${now.getMinutes()} :${now.getSeconds()}  `;
};
const disableBidding = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield productModel_1.default.findById(productId);
    if (!product)
        return;
    product.status = "Transaction";
    if (product.allBidder.length == 0) {
        product.status = "Expired";
        yield product.save();
        return;
    }
    yield product.save();
    yield (0, exports.allowNextBidder)(productId, 0, null);
});
exports.disableBidding = disableBidding;
const allowNextBidder = (productId, currIndex, job) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield productModel_1.default.findById(productId).populate("allBidder.bidder");
    if (!product) {
        return;
    }
    if (product.status === "Completed" ||
        product.status === "PaymentOnDelivery") {
        console.log("cancel job");
        job === null || job === void 0 ? void 0 : job.cancel();
        return;
    }
    let bidderLen = product.allBidder.length;
    const allBidder = product.allBidder.sort((a, b) => b.bidAmount - a.bidAmount) || [];
    if (currIndex >= bidderLen) {
        if (currIndex === bidderLen) {
            const prevWinner = allBidder[currIndex - 1];
            if (!prevWinner || !prevWinner.paymentInfo)
                return;
            prevWinner.paymentInfo.status = "Expired";
        }
        product.status = "Expired";
        yield product.save();
        if (job)
            job.cancel();
    }
    else {
        const currWinner = allBidder[currIndex];
        if (currIndex !== 0) {
            const prevWinner = allBidder[currIndex - 1];
            if (!prevWinner || !prevWinner.paymentInfo)
                return;
            prevWinner.paymentInfo.status = "Expired";
        }
        const currentDate = new Date();
        currentDate.setMinutes(currentDate.getMinutes() + product.timeToPay);
        if (!currWinner || !currWinner.paymentInfo)
            return;
        currWinner.paymentInfo.status = "Pending";
        currWinner.paymentInfo.paymentDeadline = currentDate;
        yield product.save();
        const bidder = currWinner.bidder;
        yield (0, sendEmail_1.default)({
            to: [bidder.email],
            subject: "Bidding  Payment!",
            text: `Transaction: ${product.title} `,
            html: (0, bidPaymentEmail_1.bidPaymentHTML)(product.images[0].fileimage, product.title, currWinner.bidAmount, product.timeToPay)
        });
        const newJob = node_schedule_1.default.scheduleJob(currWinner.paymentInfo.paymentDeadline, () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, exports.allowNextBidder)(productId, currIndex + 1, newJob);
        }));
    }
});
exports.allowNextBidder = allowNextBidder;
const sendBidEndingNotification = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield productModel_1.default.findById(productId).populate({
        path: "allBidder",
        select: "bidder",
        populate: {
            path: "bidder",
            select: "email", // Specify the field to select from the populated documents
        },
    });
    if (!product || product.allBidder.length == 0) {
        return;
    }
    const emailList = product.allBidder.map((curr_bidder) => {
        const bidder = curr_bidder.bidder;
        return bidder.email;
    });
    // export const bidEndingHtml = (images: string, title: string) => {
    yield (0, sendEmail_1.default)({
        to: emailList,
        subject: "Bidding  Ending Soon!,",
        text: `${product.title} bidding is about to end. Bid now to win! `,
        html: (0, bidEndingEmail_1.bidEndingHtml)(product.images[0].fileimage, product.title)
    });
    return product;
});
exports.sendBidEndingNotification = sendBidEndingNotification;
