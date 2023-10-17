require("dotenv").config();

const mongoose = require("mongoose");
mongoose
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

const UserSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    default: "native",
  },
  name: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 127,
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
  },
  // 入會時間 (給人看的)
  date: {
    type: String,
    default: new Date(Date.now()).toDateString(),
  },
  dateinnow: {
    type: Date,
    default: Number(Date.now()),
  },
  level: {
    type: Number,
    default: 1,
  },
  // optional content, not requested when registering
  birthday: {
    type: String,
  },

  birthplace: {
    type: String,
  },
  hobby: {
    type: String,
  },

  occupation: {
    type: String,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Trans", "Else", "PNTT", "Unknown"],
    default: "Unknown",
  },
  // password
  password: {
    type: String,
    maxLength: 1024,
  },
  // recorded by system
  // unidirection relationship
  following_user: {
    type: Array,
    default: undefined,
  },
  // bidirection relationship
  friend: {
    type: Array,
    default: undefined,
  },
  // favorite restaurant
  favorite: {
    type: Array,
    default: undefined,
  },
  history: {
    //browsing history
    type: Array,
    default: undefined,
  },
});

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 127,
  },
  esid: {
    type: String,
    required: true,
  },
  review: {
    type: Array,
    default: undefined,
  },
  fan: {
    type: Array,
    default: undefined,
  },
  num_review: {
    type: Number,
    default: 0,
  },
  total_rating: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: "",
  },
  hashtag: {
    type: Array,
    default: undefined,
  },
});

const User = mongoose.model("user", UserSchema, "altUser");
const Restaurant = mongoose.model("restaurant", RestaurantSchema, "restaurant");
const { Client } = require("@elastic/elasticsearch");
const elasticClient = new Client({
  cloud: {
    id: process.env.ES_CLOUD_ID,
  },
  auth: {
    username: process.env.ES_USER,
    password: process.env.ES_PASSWORD,
  },
});

module.exports = { User, Restaurant, elasticClient };
