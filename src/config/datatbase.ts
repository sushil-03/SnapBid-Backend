import mongoose from "mongoose";
const connectionString = `mongodb+srv://sushil:${process.env.DB_PASS}@cluster0.hzhsnsh.mongodb.net/?retryWrites=true&w=majority`;


const connectDB = async () => {
  await mongoose
    .connect(connectionString)
    .then((data) => {
      console.log(`Mongodb is connected with server ${data.connection.host}`);
    })
    .catch((error) => {
      console.log("Mongodb error", error);
    });
};
export default connectDB
// module.exports = connectDB;
