require("dotenv").config();
const mongoose = require("mongoose");

const connection = mongoose
  .connect(process.env.MONGO_DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to mongodb atlas");
  })
  .catch((err) => {
    console.log("Failed connecting to mongodb atlas:", err);
  });

// .catch((error) => console.log('mongoDB connection error: ', error.reason));

// mongoose.Promise = global.Promise;

module.exports = connection;
