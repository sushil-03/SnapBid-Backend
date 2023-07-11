const AsyncError = require("../middleware/asyncError");
const User = require("../models/userModel");
const sendToken = require("../utils/sendToken");
const ErrorHandler = require("../utils/errorHandler");
//Register a User
exports.registerUser = AsyncError(async (req, res, next) => {
  const {
    firstname,
    lastname,
    country,
    state,
    pincode,
    contact,
    email,
    password,
  } = req.body;
  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(400).json({
      success: false,
      message: "User Already Exist",
    });
  }
  const user = await User.create({
    firstname,
    lastname,
    email,
    country,
    state,
    pincode,
    contact,
    password,
  });
  sendToken(user, 201, res);
});

// log in
exports.loginUser = AsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email and Password"), 400);
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password"), 401);
  }
  const isPasswordMatch = await user.comparePassword(password, user.password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Not match email or password"), 401);
  }
  sendToken(user, 200, res);
});

//LogOut user
exports.logoutUser = AsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  return res.status(200).json({
    success: true,
    message: "Logged Out successfully",
  });
});

//Get User details
exports.getUserDetails = AsyncError(async (req, res, next) => {
  const _id = req.params.id;
  const user = await User.findById(_id);

  console.log("This user is requ", user);
  res.status(200).json({
    success: true,
    user,
  });
});

//Update User Profile
exports.updateProfile = AsyncError(async (req, res, next) => {
  const updateData = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findById(req.user.id);
  if (req.body.avatar != user.avatar.url) {
    const imageId = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(imageId);

    myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
    updateData.avatar = {
      public_id: myCloud ? myCloud.public_id : "no-image",
      // url: myCloud ? myCloud.secure_url : "/profile2.png",
      url: myCloud
        ? myCloud.secure_url
        : "/https://res.cloudinary.com/dlv5hu0eq/image/upload/v1655021406/basicData/profile2_muu58h.png",
    };
  }

  await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});
//Get all user
exports.getAllUser = AsyncError(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

//Get single user
exports.loadUser = AsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler(`User must sign in first`), 400);
  }
  res.status(200).json({
    success: true,
    user,
  });
});
exports.getSingleUser = AsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate("products.product")
    .populate("bidWon.product");
  console.log("req.params.id", req.params.id);
  console.log("user", user);
  if (!user) {
    return next(new ErrorHandler(`User must sign in first`), 400);
  }
  res.status(200).json({
    success: true,
    user,
  });
});
