const mongoose = require("mongoose");
const connectionString = `mongodb+srv://sushil:${process.env.DB_PASS}@cluster0.hzhsnsh.mongodb.net/?retryWrites=true&w=majority`;


const connectDB = () => {
  mongoose
    .connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`Mongodb is connected with server ${data.connection.host}`);
    })
    .catch((error) => {
      console.log("Mongodb error", error);
    });
};
module.exports = connectDB;
