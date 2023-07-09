const sendToken = (user, statusCode, res) => {
  console.log("send token called");
  const token = user.getJWTToken();

  res.status(statusCode).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
