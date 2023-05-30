const sendToken = (user, statusCode, res) => {
  console.log("send token called");
  const token = user.getJWTToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    // domain: "http://localhost:3000/",
    // secure: !dev,
    secure: false,
    // maxAge: 60 * 60 * 24 * 30 * 1000,
  };
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
