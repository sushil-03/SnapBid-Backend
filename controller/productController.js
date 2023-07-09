const AsyncError = require("../middleware/asyncError");
const Product = require("../models/productModel");
const CronJob = require("cron").CronJob;

var job = new CronJob(
  "* * * * *",
  async () => {
    const expiredProducts = await Product.find({
      endTime: { $lte: currentTime },
      status: "active",
      winner: { $exists: false },
    });
  },
  null,
  true
);
job.start();
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
    paymentInfo,
    shippingInfo,
  } = req.body;

  // console.log("user present", req.user);

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
    paymentInfo,
    shippingInfo,
    createdBy: req.user,
  });
  console.log("__PRODUCT_CREATED ", product);
  res.status(201).json({
    message: "Good",
    product,
  });
});
exports.getAllProduct = AsyncError(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    products,
  });
});
exports.getProductById = AsyncError(async (req, res, next) => {
  const product = await Product.findById({ _id: req.params.id })
    .populate("createdBy")
    .populate("allBidder.bidder");
  if (!product) {
    return next(new Error("Product not found"));
  }
  product.allBidder.sort((a, b) => b.bidAmount - a.bidAmount);

  res.status(200).json({
    product,
    success: true,
  });
});
exports.placeBid = AsyncError(async (req, res, next) => {
  const product = await Product.findById({ _id: req.body.productId });
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
