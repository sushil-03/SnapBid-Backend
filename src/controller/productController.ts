import AsyncError from "../middleware/asyncError";
import Product from "../models/productModel";
import schedule from "node-schedule";
import User from "../models/userModel";
const stripe = require("stripe")(process.env.STRIPE_PUBLISHABLE_KEY);

import { enableBidding, disableBidding, sendBidEndingNotification, allowNextBidder } from "../utils/bidHandler";
import { createOrder } from "./orderController";
import { AuthenticatedRequest } from "../types/utils";
import { NextFunction, Response, Request } from "express";
import { Types } from "mongoose";

export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const {
    brand,
    title,
    category,
    condition,
    description,
    endingDate,
    endingTime,
    startingDate,
    startingTime,
    startingBid,
    images,
    owner,
    timeToPay,
    starting,
    ending,
    paymentOption,
    shippingInfo,
    enable_email,
    addressFrom,
    bidIncrement,
  } = req.body;

  const user = await User.findById({ _id: req.user?._id });
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  const product = await Product.create({
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
  await user.save();

  const timestampEndingNotification = new Date(ending);
  const startingTimeStamp = new Date(starting);
  timestampEndingNotification.setMinutes(
    timestampEndingNotification.getMinutes() - 10
  );

  if (enable_email && startingTimeStamp < timestampEndingNotification) {
    console.log('Starting ending bid email at', timestampEndingNotification);

    schedule.scheduleJob(timestampEndingNotification, async () => {
      await sendBidEndingNotification(product._id);
      console.log("email sent successfull");
    });
  }

  schedule.scheduleJob(starting, async () => {
    await enableBidding(product._id);
  });
  schedule.scheduleJob(ending, async () => {
    await disableBidding(product._id);
  });

  res.status(201).json({
    message: "Good",
    product,
  });
};

export const placeBid = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const product = await Product.findById({ _id: req.body.productId });
  if (!product) {
    return res.status(400).json({
      success: false,
      message: "Product not found"
    })
  }
  if (!req.user) {
    return res.status(400).json({
      success: false,
      message: "user not found"
    })
  }
  const user = req.user
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
  await product.save();

  res.status(200).json({
    success: true,
    product,
  });
};
export const getAllProduct = async (req: Request, res: Response, next: NextFunction) => {
  const st = new Date()

  let products;
  const page = parseInt(req.query.page as string) || 1;
  const category = req.query.category;
  const status = req.query.status;
  const limit = 10;
  const search = req.query.search;
  const skip = (page - 1) * limit;

  const searchObj: any = {};
  if (category && category !== "") {
    searchObj.category = category;
  }
  if (search && search !== "") {
    searchObj.$or = [
      { title: { $regex: new RegExp(search as string, "i") } },
      { description: { $regex: new RegExp(search as string, "i") } },
    ];
  }
  if (status && status !== "") {
    searchObj.status = status;
  }
  products = await Product.find(searchObj)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "createdBy",
      select: "avatar",
    });

  console.log('Time take to fetch all product', (new Date().getTime() - st.getTime()) / 1000,);
  res.status(200).json({
    success: true,
    products,
  });
};
export const getProductById = AsyncError(async (req, res, next) => {
  const product = await Product.findById({ _id: req.params.id })
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
});
export const generatePayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { productId, amount, type } = req.body;
  const paymentOption = type;
  const user = req.user;

  if (!user || user.selectedAddress < 0) {
    return res.status(404).json({
      message: "Please check your detail",
    });
  }

  const product = await Product.findOne({
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
        if (!bidder.paymentInfo.paymentDeadline) return;

        if (bidder.paymentInfo.paymentDeadline < new Date()) {
          return res.status(404).json({
            message: "Payment deadline is expired",
          });
        } else {
          if (paymentOption === "offline") {
            bidder.paymentInfo.status = "PaymentOnDelivery";
            bidder.paymentInfo.paymentAmount = bidder.bidAmount;

            const winner = await User.findById({ _id: bidder.bidder });
            if (!winner) {
              return res.status(400).json({
                success: false,
                message: 'Winner not found'
              })
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
            product.bidwinner = bidder.bidder as Types.ObjectId;

            //  receiver, product, amount
            const order = await createOrder({
              bidderId: bidder.bidder._id,
              productId,
              paymentMethod: "offline",
              amount: bidder.bidAmount
            });
            if (order) {
              await product.save();
              await winner.save();
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
          } else {
            if (!bidder._id) {

              return res.status(400).json({
                success: false,
                message: 'Bidder not found'
              })
            }
            // Online Stripe Payment
            const metadata = {
              productId: productId,
              bidder: bidder._id.toString(),
            };
            const price = await stripe.prices.create({
              currency: "inr",
              unit_amount: bidder.bidAmount * 100,
              product_data: {
                name: product.title,
                metadata,
              },
            });

            const session = await stripe.checkout.sessions.create({
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
};

export const updateProductStatusOnSuccess = async ({
  productId,
  bidder,
}: {
  productId: Types.ObjectId,
  bidder: Types.ObjectId,
}) => {
console.log("Updating backend from online payment")
  const product = await Product.findOne({
    _id: productId,
    ending: { $lte: Date.now() },
  });
  console.log("product fonfound",product)
  if (!product) {
    return { success: false, message: "Product not found" }
  }

  const selectedBidder = product.allBidder.find((currBidder:any) => {
    return currBidder._id.toString() === bidder.toString();
  });

  console.log("selected bidde",selectedBidder,bidder)
  if (!selectedBidder) {
    return;
  }
  selectedBidder.paymentInfo.status = "Completed";
  selectedBidder.paymentInfo.paymentAt = new Date();
  selectedBidder.paymentInfo.paymentAmount = selectedBidder.bidAmount;

  const winner = await User.findById({ _id: selectedBidder.bidder });
  console.log('winner',winner)
  if (!winner) return;

  winner.bidWon.push({ product: product._id });
  const seller = await User.findById({ _id: product.createdBy });

  console.log('seller',seller)

  if (!seller) return;
  seller.revenue += selectedBidder.bidAmount;
  await seller.save();
  // !TODO Update product status
  product.status = "Completed";
  const { country, city, state, pincode } =
    winner.address[winner.selectedAddress];

  product.addressTo = {
    country,
    city,
    state,
    pincode,
  };
  product.bidwinner = selectedBidder.bidder._id;
  product.paymentReceived = true;

  // await createOrder()
  await createOrder({
    bidderId: selectedBidder.bidder._id,
    productId,
    paymentMethod: "online",
    amount: selectedBidder.bidAmount
  }
  );
  console.log("ENding")
  await product.save();
  await winner.save();
  return;
};

// const getTimeInFormat = (time) => {
//   // const now = new Date();
//   return `${time.getHours()} : ${time.getMinutes()} :${time.getSeconds()}  `;
// };
function subtractTimes(currTime: Date, endingTime: Date, timeToPay: number) {
  // Convert time strings to Date objects
  const date1 = new Date(currTime);
  const date2 = new Date(endingTime);

  // Calculate the time difference in milliseconds
  const differenceMs = date1.getTime() - date2.getTime();
  const newdate = new Date(differenceMs);
  const index = differenceMs / (timeToPay * 60 * 1000);

  const rem = timeToPay * 60 * 100 - differenceMs;
  console.log("remainging time", rem, differenceMs, newdate, index);

  return Math.floor(index);
}

function addMinutesToDeadline(deadline: Date, minutesToAdd: number) {
  // Convert deadline string to Date object
  const deadlineDate = new Date(deadline);

  // Add minutes to the deadline Date object
  deadlineDate.setMinutes(deadlineDate.getMinutes() + minutesToAdd);

  // Return the updated deadline Date object
  return deadlineDate.toISOString(); // Convert Date object back to ISO 8601 string
}

export const restartCronJob = async () => {
  console.log("-------------------Restarting CRON JOB------------------");
  const products = await Product.find({
    status: { $in: ["Pending", "Active", "Transaction"] },
  }).populate("allBidder.bidder");

  const productLen = products.length;
  for (let i = 0; i < productLen; i++) {
    const currentTime = new Date();

    const product = products[i];
    console.log("FOR PRODUCT ID: ", product.title, product.status);

    const endingTime = new Date(product.ending);
    const totalTransactionTimeInMinutes =
      product.timeToPay * product.allBidder.length;

    const totalTransactionTime = endingTime.setMinutes(
      endingTime.getMinutes() + totalTransactionTimeInMinutes
    );

    // Status pending but should start bidding ->Active
    // Status pending but transaction should start ->Allow Pay
    // Status pending but transaction end -> Expired
    if (product.status === "Pending" && currentTime < product.ending) {
      if (currentTime < product.starting) {
        console.log("Started CRON JOB for starting bidding");
        schedule.scheduleJob(product.starting, async () => {
          await enableBidding(product._id);
        });
        const timestampEndingNotification = new Date(product.ending);
        const startingTimeStamp = new Date(product.starting);
        timestampEndingNotification.setMinutes(
          timestampEndingNotification.getMinutes() - 10
        );

        if (
          product.enable_email &&
          startingTimeStamp < timestampEndingNotification
        ) {
          console.log("Scheduling job for sending bid end notification");
          schedule.scheduleJob(timestampEndingNotification, async () => {
            await sendBidEndingNotification(product._id);
            console.log("email sent successfull");
          });
        }
      } else {
        console.log("Change product status to active");
        product.status = "Active";
        await product.save();
        //TODO Apply sceduler till end time
        console.log("Started CRON JOB for ending bidding");
        schedule.scheduleJob(product.ending, async () => {
          await disableBidding(product._id);
        });
      }
    } else if (product.status === "Active" && currentTime < product.ending) {
      console.log("Started CRON JOB for ending bidding");
      schedule.scheduleJob(product.ending, async () => {
        await disableBidding(product._id);
      });
    } else {
      if (currentTime.getTime() < totalTransactionTime) {
        console.log("Change product status to transaction");
        product.status = "Transaction";

        const index = subtractTimes(currentTime, product.ending, product.timeToPay);
        console.log("Allow bidder of index to pay", index);

        const allBidder =
          product.allBidder.sort((a, b) => b.bidAmount - a.bidAmount) || [];
        console.log('all bidder endingllll', product.ending);
        console.log('all bidder', allBidder);

        console.log('index bidder', index);

        allBidder[index].paymentInfo.status = "Pending";
        if (index >= allBidder.length) {
          product.status = "Expired";
          await product.save();
        } else {
          const deadline = addMinutesToDeadline(
            product.ending,
            (index + 1) * product.timeToPay
          );
          if (index != 0) {
            allBidder[index - 1].paymentInfo.status = "Prohibited";
          }
          allBidder[index].paymentInfo.paymentDeadline = new Date(deadline);
          await product.save();

          console.log("Started CRON JOB for next payment ");
          const newJob = schedule.scheduleJob(deadline, async () => {
            await allowNextBidder(product._id, index + 1, newJob);
          });
        }

      } else {
        console.log("EXPIRING PRODUCT");
        product.status = "Expired";
        await product.save();
      }
    }

    // Status bidding(Active) but transaction should start
    // Status bidding(Active) but transaction end

    // Status transaction but should allow next bidder
    // Allow correct bidder
  }
  console.log("---------------ENDING---------------------");
};
