import Product from "../models/productModel";
import schedule, { Job } from "node-schedule";
import { bidEndingHtml } from "../templates/bidEndingEmail";
import sendEmail from "./sendEmail";
import { bidPaymentHTML } from "../templates/bidPaymentEmail";
import { ObjectId, Types } from "mongoose";
import { UserType } from "../models/userModel";

export const enableBidding = async (productId: Types.ObjectId) => {
  console.log("Bidding Started");
  const product = await Product.findById(productId);
  if (!product) {
    return;

  }
  product.status = "Active";
  await product.save();
};
const getCurrTime = () => {
  const now = new Date();
  return `${now.getHours()} : ${now.getMinutes()} :${now.getSeconds()}  `;
};
export const disableBidding = async (productId: Types.ObjectId) => {
  const product = await Product.findById(productId);
  if (!product) return;
  product.status = "Transaction";

  if (product.allBidder.length == 0) {
    product.status = "Expired";
    await product.save();
    return;
  }

  await product.save();
  await allowNextBidder(productId, 0, null);
};

export const allowNextBidder = async (productId: Types.ObjectId, currIndex: number, job: Job | null) => {
  const product = await Product.findById(productId).populate(
    "allBidder.bidder"
  );
  if (!product) {
    return;
  }
  if (
    product.status === "Completed" ||
    product.status === "PaymentOnDelivery"
  ) {
    console.log("cancel job");
    job?.cancel();
    return;
  }
  let bidderLen = product.allBidder.length;
  const allBidder =
    product.allBidder.sort((a, b) => b.bidAmount - a.bidAmount) || [];
  if (currIndex >= bidderLen) {
    if (currIndex === bidderLen) {
      const prevWinner = allBidder[currIndex - 1];
      if (!prevWinner || !prevWinner.paymentInfo) return;
      prevWinner.paymentInfo.status = "Expired";
    }
    product.status = "Expired";
    await product.save();
    if (job)
      job.cancel();
  } else {
    const currWinner = allBidder[currIndex];
    if (currIndex !== 0) {
      const prevWinner = allBidder[currIndex - 1];
      if (!prevWinner || !prevWinner.paymentInfo) return;
      prevWinner.paymentInfo.status = "Expired";
    }
    const currentDate = new Date();
    currentDate.setMinutes(
      currentDate.getMinutes() + product.timeToPay
    );
    if (!currWinner || !currWinner.paymentInfo) return;
    currWinner.paymentInfo.status = "Pending";
    currWinner.paymentInfo.paymentDeadline = currentDate

    await product.save();
    const bidder = currWinner.bidder as UserType
    await sendEmail({
      to: [bidder.email],
      subject: "Bidding  Payment!",
      text: `Transaction: ${product.title} `,
      html: bidPaymentHTML(
        product.images[0].fileimage,
        product.title,
        currWinner.bidAmount,
        product.timeToPay
      )
    }
    );
    const newJob = schedule.scheduleJob(
      currWinner.paymentInfo.paymentDeadline,
      async () => {
        await allowNextBidder(productId, currIndex + 1, newJob);
      }
    );
  }
};

export const sendBidEndingNotification = async (productId: Types.ObjectId) => {
  const product = await Product.findById(productId).populate({
    path: "allBidder",
    select: "bidder", // Specify the field to populate
    populate: {
      path: "bidder",
      select: "email", // Specify the field to select from the populated documents
    },
  });
  if (!product || product.allBidder.length == 0) {
    return;
  }
  const emailList = product.allBidder.map((curr_bidder) => {
    const bidder = curr_bidder.bidder as UserType;
    return bidder.email;
  });


  // export const bidEndingHtml = (images: string, title: string) => {
  await sendEmail({
    to: emailList,
    subject: "Bidding  Ending Soon!,",
    text: `${product.title} bidding is about to end. Bid now to win! `,
    html: bidEndingHtml(
      product.images[0].fileimage,
      product.title,
    )
  })

  return product;

}