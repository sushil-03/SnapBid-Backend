const app = require("./app");
require("dotenv").config({ path: "./config/config.env" });
const connectDatabase = require("./config/database");
const cloudinary = require("cloudinary");

const PORT = 3001;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
connectDatabase();
app.use("/", (req, res) => {
  res.json({
    message: "Something ",
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on PORT http://localhost:${PORT}`);
});
