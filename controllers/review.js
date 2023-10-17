require("dotenv").config();
const asyncHandler = require("express-async-handler");
const { Restaurant, User } = require("../utils/db");
const jwt = require("jsonwebtoken");

const getReview = asyncHandler(async (req, res) => {
  const rid = req.query.id;
  const filter = { esid: rid };

  let result;
  try {
    const target_restaurant = await Restaurant.findOne(filter, "review").exec();
    if (!target_restaurant) {
      result = [];
      res.json({ state: "Restaurant not found.", code: 0, result });
    } else {
      result = target_restaurant;
      res.json({ state: "Restaurant found.", code: 1, result });
    }
  } catch (err) {
    console.log("an error occurred: ", err);
    res.status(404).json({ state: "failed", err });
    return;
  }
});

const postReview = asyncHandler(async (req, res) => {
  console.log("req.body: ", req.body);
  const {
    restaurant_esid,
    restaurant_name,
    title,
    content,
    rating,
    personal_token,
  } = req.body;
  let decoded;
  try {
    let rule_out_token = req.headers.authorization.replace("Bearer ", "");
    decoded = jwt.verify(rule_out_token, private_key);
  } catch (err) {
    console.log("An error occurred on verifying token: ", err);
    res.status(403).json({ state: "failed verifying token" });
    return;
  }
  const user_result = await User.findOne(
    { email: personal_token },
    "_id name"
  ).exec();

  if (!user_result) {
    console.log("User not found!");
    res.status(404).json({ state: "User not found!" });
    return;
  }

  const user_id = user_result._id;
  const user_name = user_result.name;
  const filter = { esid: restaurant_esid };
  const result = await Restaurant.findOne(filter).exec();
  const cur_time = Date.now();
  if (!result) {
    // restaurant not in mongoDB; create one.
    let new_restaurant = new Restaurant({
      esid: restaurant_esid,
      name: restaurant_name,
      review: [
        {
          author: user_name,
          author_id: user_id,
          title,
          content,
          rating,
          time: cur_time,
        },
      ],
      num_review: 1,
      total_rating: rating,
    });
    try {
      const save_result = await new_restaurant.save();
      console.log("successfully creating a restaurant:", save_result);
    } catch (err) {
      console.log("creating restaurant failed because of:", err);
    }
  } else {
    //restaurant already in mongoDB; update it.
    if (result.name != restaurant_name) {
      console.log("name of restaurant does not match!!....just a reminder~");
    }
    const update_review_push = {
      $push: {
        review: {
          author: user_name,
          author_id: user_id,
          title,
          content,
          rating,
          time: cur_time,
        },
      },
      $inc: { num_review: 1, total_rating: rating },
    };
    const update_result = await Restaurant.findOneAndUpdate(
      filter,
      update_review_push,
      { new: true }
    ).exec();
    console.log("updated_result:", update_result);
  }

  const name = user_name;
  const time = cur_time;
  console.log("restaurant_esid: ", restaurant_esid);
  console.log("restaurant_name: ", restaurant_name);
  const response = { name, title, content, time, rating };
  res.status(200).json(response);
});

module.exports = { getReview, postReview };
