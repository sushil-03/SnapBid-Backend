const app = require("./app");
require("dotenv").config({ path: "./config/config.env" });
const connectDatabase = require("./config/database");

const PORT = 3001;

connectDatabase();

app.listen(PORT, () => {
  console.log(`Server is running on PORT http://localhost:${PORT}`);
});
