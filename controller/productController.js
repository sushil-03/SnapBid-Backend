const AsyncError = require("../middleware/asyncError");
const Product = require("../models/productModel");
const CronJob = require("cron").CronJob;
const schedule = require("node-schedule");
const User = require("../models/userModel");

const helper = async () => {
  // running Product
  console.log("running helper");
  const runningProduct =
    (await Product.find({
      starting: { $lte: Date.now() },
      ending: { $gte: Date.now() },
      status: "Pending",
    })) || [];
  if (runningProduct.length > 0) {
    runningProduct.map(async (product, key) => {
      product.status = "Active";
      await product.save();
    });
  }

  // expired Product
  const expiredProduct = await Product.find({
    ending: { $lte: Date.now() },
    $or: [{ status: "Transaction" }, { status: "Active" }],
  });
  console.log("expired", expiredProduct);
  if (expiredProduct.length > 0) {
    for (const product of expiredProduct) {
      product.status = "Transaction";
      const currDate = new Date();
      const allBidder =
        product.allBidder.sort((a, b) => b.bidAmount - a.bidAmount) || [];

      if (allBidder.length == 0) {
        product.status = "Expired";
        await product.save();
        return;
      }
      const winner = allBidder[0];

      if (winner.paymentInfo.status === "Prohibited") {
        const currentDate = new Date();
        winner.paymentInfo.paymentDeadline = new Date(
          currentDate.getTime() + 2 * 60 * 60 * 1000
        );
        winner.paymentInfo.status = "Pending";
      } else if (winner.paymentInfo.status === "Pending") {
        if (winner.paymentInfo.paymentDeadline < currDate) {
          winner.paymentInfo.status = "Expired";
        }
      }

      await product.save();
    }
  }
  const testProduct = await Product.find({
    ending: { $gte: Date.now() },
  });
};
exports.generatePayment = AsyncError(async (req, res, next) => {
  const { productId, amount } = req.body;
  console.log("checking amonu", productId, amount);
  const product = await Product.findOne({
    _id: productId,
    ending: { $lte: Date.now() },
  });
  if (!product) {
    return next(new Error("Product not available for bidding"));
  }

  console.log("Payment product", product);

  product.status = "Transaction";
  const user = req.user;

  for (const bidder of product.allBidder) {
    console.log("Check bids equals  ", bidder.bidder._id, user._id);

    if (bidder.bidder._id.toString() === user._id.toString()) {
      console.log("bidder detail", bidder);
      if (bidder.paymentInfo.paymentDeadline < Date.now()) {
        return next(new Error("Payment deadline is expired"));
      }
      if (bidder.paymentInfo.status === "Completed") {
        return next(new Error("Payment already done"));
      } else if (bidder.paymentInfo.status === "Pending") {
        // make payment;
        product.status = "Completed";
        bidder.paymentInfo.status = "Completed";
        bidder.paymentInfo.paymentAt = new Date();
        bidder.paymentInfo.paymentAmount = amount;
        bidder.paymentInfo.paymentDeadline = new Date() - 200000;
        product.bidwinner = bidder.bidder._id;
        const user = await User.findById({ _id: bidder.bidder._id });
        user.bidWon.push({ product: product._id });
        console.log("amount********** ,", amount, typeof amount);
        user.revenue += parseInt(amount);
        await user.save();
      } else if (bidder.paymentInfo.status === "Expired") {
        return next(new Error("Payment is expired"));
      } else if (bidder.paymentInfo.status === "Prohibited") {
        return next(new Error("Payment is prohibited"));
      }
      break;
    }
  }
  console.log("payemnt product", product);
  await product.save();
  res.status(200).json({
    success: true,
    product,
  });
});

exports.placeBid = AsyncError(async (req, res, next) => {
  const product = await Product.findById({ _id: req.body.productId });
  if (product.status !== "Active") {
    return next(new Error("Product is not active for bidding"));
  }
  if (product.maxBid >= req.body.amount) {
    return next(new Error("Bid amount is less than current bid"));
  }
  if (req.user._id.toString() === product.createdBy._id.toString()) {
    return next(new Error("Owner can't place bid"));
  }

  const bidder = req.user;
  const bidAmount = req.body.amount;
  product.maxBid = bidAmount;
  const newbids = product.allBidder.filter((bid) => {
    return req.user._id.toString() !== bid.bidder._id.toString();
  });

  newbids.push({ bidder, bidAmount });
  product.allBidder = newbids;
  await product.save();

  console.log("New bidssss", product);
  res.status(200).json({
    success: true,
    product,
  });
});
exports.createProduct = AsyncError(async (req, res, next) => {
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
    location,
    owner,
    starting,
    ending,
    paymentInfo,
    shippingInfo,
  } = req.body;

  const product = await Product.create({
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
    location,
    owner,
    starting,
    ending,
    paymentInfo,
    shippingInfo,
    createdBy: req.user,
  });
  const user = await User.findById({ _id: req.user._id });
  user.products.push({ product: product._id });
  await user.save();

  schedule.scheduleJob(starting, async () => {
    console.log("Starting helper ***********************");
    await helper();
  });
  schedule.scheduleJob(ending, async () => {
    console.log("Ending helper ***********************");
    await helper();
  });
  schedule.scheduleJob(ending + 2 * 60 * 60 * 1000, async () => {
    console.log("transaction helper ***********************");
    await helper();
  });
  res.status(201).json({
    message: "Good",
    product,
  });
});
exports.getAllProduct = AsyncError(async (req, res, next) => {
  // helper();
  console.log("Called *****************88", req.query);
  let products;
  if (req.query.category === "") {
    console.log("All products");
    products = await Product.find();
  } else {
    products = await Product.find({ category: req.query.category });
    console.log("Products of category", req.query.category);
  }
  console.log("Called products", products);
  res.status(200).json({
    success: true,
    products,
  });
});
exports.getProductById = AsyncError(async (req, res, next) => {
  helper();
  const product = await Product.findById({ _id: req.params.id })
    .populate("createdBy")
    .populate("allBidder.bidder")
    .populate("bidwinner");
  if (!product) {
    return next(new Error("Product not found"));
  }
  product.allBidder.sort((a, b) => b.bidAmount - a.bidAmount);

  res.status(200).json({
    product,
    success: true,
  });
});
