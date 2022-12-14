require("dotenv").config();
const express = require("express");
//
const favicon = require("serve-favicon");
const path = require("path");
//
const app = express();
const public = "public";
app.use(express.static(public));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const { spawn } = require("child_process");
const jwt = require("jsonwebtoken");
const private_key = process.env.PRIVATE_KEY;
const { LanguageServiceClient } = require("@google-cloud/language").v1;
const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const profile_route = require("./routes/profile");

//const languageClient = new LanguageServiceClient({ credentials: creds });
const languageClient = new LanguageServiceClient();
//const mapsClient = new Client({});

// note how to deal with Client namespace here
//const { Client } = require("@googlemaps/google-maps-services-js");

// elasticsearch client
const { Client } = require("@elastic/elasticsearch");
const { restart } = require("nodemon");
const elasticClient = new Client({
  cloud: {
    id: process.env.ES_CLOUD_ID,
  },
  auth: {
    username: process.env.ES_USER,
    password: process.env.ES_PASSWORD,
  },
});
const INDEX_NAME = process.env.INDEX_NAME;

// mongoDB client
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

const port = 3000;
app.use(cors());
app.use(favicon(path.join(__dirname, "public", "mai.jpg")));
//app.use("/profile", profile_route);

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
  // ???????????? (????????????)
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

//const nsUser = mongoose.model("user", Any);

app.get("/friends", async (req, res) => {
  const email = req.query.email;
  console.log("req query email: ", email);
  let rule_out_token;
  try {
    rule_out_token = req.headers.authorization.replace("Bearer ", "");
  } catch (err) {
    console.log("err:", err);
    res.status(401).json({ state: "No token", err });
  }

  let decoded;
  try {
    decoded = jwt.verify(rule_out_token, private_key); //promise
    //do something with data in decoded
  } catch (err) {
    console.log("Invalid token: ", err);
    res.status(403).json({ state: "Invalid token" });
    return;
  }

  // token????????????email???????????????email??????
  if (decoded.email !== email) {
    res.status(403).json({ state: "Invalid token" });
  }

  //uri: /friends?email=alextai@gmail%2Ecom
  const aggregate = User.aggregate([
    {
      $match: {
        email,
      },
    },
    {
      $project: {
        friend: 1,
        _id: 0,
      },
    },
    {
      $unwind: {
        path: "$friend",
      },
    },
    {
      $lookup: {
        from: "altUser",
        localField: "friend",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $project: {
        _id: "$friend",
        name: {
          $arrayElemAt: ["$result", 0],
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: "$name.name",
        date: "$name.date",
      },
    },
  ]);
  const result = await aggregate.exec();
  // result?????????(response.data)
  console.log(JSON.stringify(result));
  res.json(result);
});

// add an user to friend list
// req: Object_id
app.post("/friend", async (req, res) => {
  console.log("people who want to add someone else as friend:", req.body.ich);
  console.log("people to be added as friend:", req.body.sie);
  try {
    const new_friend = req.body.sie;
    //
    const user = req.body.ich;
    console.log({ new_friend, user });
    const filter = { _id: user };
    const required_cols = "_id";
    const ich_bin = await User.findOne(filter, required_cols).exec();
    console.log("ich_bin: ", ich_bin);
    if (ich_bin) {
      const update_filter = filter;
      const update_command = {
        $push: {
          friend: { _id: new_friend },
        },
      };
      const update_result = await User.findOneAndUpdate(
        update_filter,
        update_command,
        {
          new: true,
        }
      ).exec();
      res.status(200).json({ update_result });
    } else {
      // ???????????????????????????????
      const error_msg = "user with this id does not exist.";
      res.status(502).json({ error: error_msg });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

// delete an user from friend list
// req: Object_id
app.put("/friend", async (req, res) => {
  console.log("req.body: ", req.body);
  console.log(
    "people who want to delete someone else from friend list:",
    req.body.ich
  );
  console.log("people to be deleted from friend list:", req.body.sie);
  let result;
  try {
    const del_friend = req.body.sie;
    //
    const user = req.body.ich;
    console.log({ del_friend, user });
    const filter = { _id: user };
    const required_cols = "_id friend";
    const ich = await User.findOne(filter, required_cols).exec();
    console.log("ich bin: ", ich);
    if (ich) {
      //(placeholder)//
      ich.friend.remove(del_friend);
      ich.save();
      res.status(200).json({ ich });
    } else {
      // ???????????????????????????????
      const error_msg = `user with id "${user}" does not exist.`;
      res.status(502).json({ error: error_msg });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
  //res.status(200).json({ result: updated_result });
});
/*
  (placeholder)
  // const update_filter = filter;
  // const update_command = {
  //   $pull: {
  //     friend: { _id: del_friend },
  //   },
  // };
  // const updated_result = await User.findOneAndUpdate(
  //   update_filter,
  //   update_command,
  //   {
  //     new: true,
  //   }
  // ).exec();

  //this might work
*/

// POST favorite
app.post("/favorite", async (req, res) => {
  //console.log("post favorite");
  const email = req.body.personal_token;
  const u_data = req.body.restaurant_obj;
  const action = req.body.action;
  console.log("action: ", action);
  let rule_out_token;
  try {
    rule_out_token = req.headers.authorization.replace("Bearer ", "");
  } catch (err) {
    console.log("err:", err);
    res.status(401).json({ state: "No token", err });
  }

  let decoded;
  try {
    decoded = jwt.verify(rule_out_token, private_key);
    //do something with data in decoded
  } catch (err) {
    console.log("Invalid token: ", err);
    res.status(403).json({ state: "Invalid token" });
    return;
  }
  if (decoded.email !== email) {
    console.log("email unmatched:");
    console.log("decoded email: ", decoded.email);
    console.log("email: ", email);
    res.status(403).json({ state: "Invalid token" });
  }
  console.log("email matched:");
  console.log("decoded email: ", decoded.email);
  console.log("email: ", email);

  let result;
  let ddd = u_data.rid;
  console.log("data.rid: ", u_data.rid);
  const filter = { email };
  const update_favorite_push = { $push: { favorite: { data: u_data } } };

  if (action != 1 && action != 0) {
    res.status(500).json({ err: "invalid action code" });
    return;
  }

  // add
  if (action === 1) {
    result = await User.findOneAndUpdate(filter, update_favorite_push, {
      new: true,
    }).exec();
    //console.log("result:", result);
    res
      .status(200)
      .json({ state: "successful append favorite user data", result });
  } else {
    // action === 0; remove
    result = await User.findOne(filter, "favorite").exec();
    const favorite = result.favorite;
    //console.log("0 resul.favorite: ", favorite);

    let final_favorite = [];
    for (it of favorite) {
      if (it.data.rid !== ddd) final_favorite.push(it);
    }

    //console.log("final_favorite:", final_favorite);
    result = await User.findOneAndUpdate(filter, {
      favorite: final_favorite,
    }).exec();

    res.send(result);
  }

  //catch (err) {
  // console.log("err in posting favorite: ", err);
  // res.status(500).json({ err });

  // remove
});

app.get("/favorite", async (req, res) => {
  const email = req.query.email;
  let rule_out_token;
  try {
    rule_out_token = req.headers.authorization.replace("Bearer ", "");
  } catch (err) {
    console.log("err:", err);
    res.status(401).json({ state: "No token", err });
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(rule_out_token, private_key);
    //do something with data in decoded
  } catch (err) {
    console.log("Invalid token: ", err);
    res.status(403).json({ state: "Invalid token" });
    return;
  }

  // token????????????email???????????????email??????
  console.log("email:", email);
  console.log("decoded email:", decoded.email);
  if (decoded.email !== email) {
    res.status(403).json({ state: "Invalid token" });
    return;
  }

  //uri: /friends?email=alextai@gmail%2Ecom
  // console.log("email: ", email);

  const result = await User.findOne({ email }, "favorite").exec();
  // ???result.favorite??????.(response.data)

  console.log(JSON.stringify(result));
  res.status(200).json(result);
});

app.post("/setdata", async (req, res) => {
  const filter = { name: /Mai/i };
  const update = { age: req.body.age, occupation: req.body.occupation };
  console.log("req.body: ", req.body);
  let user;
  try {
    user = await User.findOneAndUpdate(filter, update, { new: true }).exec();
    console.log(`updated user name:${user.name} \ ${user.age}`);
    res.json(user);
  } catch (err) {
    console.log("error occurred: ", err);
    res.json({ err });
  }
});

// get user page (auth not required)
app.get("/user/:id", async (req, res) => {
  //get user id from request
  const _id = req.params.id;
  if (!_id) {
    console.log("req.params: ", req.params);
    res.json({ status: "empty request" });
    return;
  }
  const filter = { _id };
  let result;

  try {
    result = await User.findOne(
      filter,
      "-password -email -__v -_id -dateinnow -provider"
    ).exec();
    console.log(`get user data result: ${result}`);
    console.log(
      `get user data result JSONstringify: ${JSON.stringify(result)}`
    );
    if (!result) throw "No user data!!";
    else res.status(200).json({ state: "successful", result });
  } catch (err) {
    res.status(404).json({ state: "failed" }); //send an error
  }
  //
  //get user profile from mongoDB
  //
  //return user data if found
  //  user name, data, favorite(id), friend(id)
  //else return error msg and render error page
});

// get some people for user to make new friends
app.get("/person", async (req, res) => {
  const query = req.query;
  //console.log("filter:", typeof filter);
  // const filter_key = query.age;
  // const filter_value = filter_key.split(":");
  const filter = { age: { $lte: 36, $gte: 30 } };
  const required_cols = "name occupation";
  const result = await User.find(filter, required_cols)
    .limit(5)
    .sort({ age: -1 })
    .exec();

  res.json({ query, result });
});

app.post("/people", async (req, res) => {
  const people_arr = req.body.secondary_data_friend;
  const filter = { _id: { $in: people_arr } };
  const required_cols = "name age";
  const result = await User.find(filter, required_cols).exec();

  console.log("secondary_data_friend:", people_arr);
  console.log("result: ", result);
  //const result = await User.find(filter, required_cols);
  res.json({ requested_people_arr: people_arr, result });
});

app.get("/get_set_get_friend", async (req, res) => {
  const filter = { name: /Fuchigami/i };
  let users = await User.find(filter).exec();
  users = users.map((x) => (x._id ? x._id : "0"));
  console.log("found users: ", users);
  const target = { name: /alex/i };
  const update = { friend: users };
  let update_result = await User.findOneAndUpdate(target, update, {
    new: true,
  }).exec();

  let final_arr = [];
  for (u of users) {
    let one = await User.findOne({ _id: u }, "name").exec();
    final_arr.push(one);
  }
  res.send({
    state: "ok",
    data_retrieved: users,
    updated_data: update_result,
    get_one_by_one: final_arr,
  });
});

app.post("/profile", async (req, res) => {
  // QQQ.??????????????????401, 403?????? ????????????403
  try {
    //succeed
    //console.log("req.headers:", req.headers);
    //console.log("req.body:", req.body);
    let rule_out_token = req.headers.authorization.replace("Bearer ", "");
    decoded = jwt.verify(rule_out_token, private_key);
  } catch (err) {
    //fail
    console.log("An error occurred in verifying token: ", err);

    res.status(403).json({ state: "failed verifying token" });
    return;
  }
  // token verified
  // QQQ.????????????????????????token??????????????????????????????????????????????????????
  const update = req.body;
  const filter = { email: decoded.email };
  try {
    console.log("update:", JSON.stringify(update));
    const result = await User.findOneAndUpdate(filter, update, {
      new: true,
    }).exec();
    console.log("Update successful...?");
    res.json({ result });
  } catch (err) {
    console.log("an error occurred when updating data");
    res.json({ error: err });
  }
});

app.get("/profile", async (req, res) => {
  //console.log("217");
  try {
    //console.log("219");

    token = req.headers.authorization.replace("Bearer ", "");
    //console.log("token: ", token);
    if (token === "null") throw "token is empty";
  } catch (err) {
    console.log("no token or token not set correctly");
    res.status(401).json({ state: "no token" });
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, private_key);
    //do something with data in decoded
  } catch (err) {
    console.log("Invalid token: ", err);
    res.status(403).json({ state: "Invalid token" });
    return;
  }

  // query db for complete personal data
  // ?????????user???????????????
  if (!req.params.demand) {
    try {
      let one = await User.findOne(
        { email: decoded.email },
        "-password -__v -dateinnow"
      ).exec();
      if (!one) throw "No user data!!";
      res.status(200).json({ state: "successful", profile: one });
    } catch (err) {
      res.status(404).json({ state: "failed" }); //send an error
      return;
    }
  } else {
    // depends on which data are requested
    console.log("req.params: ", req.params);
    res.json({ status: "empty request" });
  }

  // authentication successful. return some data for profile rendering
});

// list of user APIs:
// POST set secondary user_data(e.g. birthday, hobbies, occupation, age, etc)
// GET get friend_list
// POST add a friend to friend_list
// POST delete a friend from friend_list
// GET get favorite_list (restaurant)
// POST save restaurants to favorite_list
// POST delete restaurants from favorite_list
// POST comments to restaurants

// list of restaurant APIs:
// GET comments

// collections list
// restaurant, comment of restaurant(?),

app.post("/signup", async (req, res) => {
  console.log("req.body: ");
  console.log(req.body);
  let { name, email, password } = req.body;
  let user = { name, email, provider: "native" };
  const email_existed = await User.findOne({ email });
  console.log("if email_existed, iw shall fail: ", email_existed);
  if (email_existed) {
    // return error
    //console.log("email_existed: ", email_existed);
  } else {
    const token = jwt.sign(user, private_key, { expiresIn: "24h" });
    const hashed_password = await bcrypt.hash(password, 10);
    let new_user = new User({ name, email, password: hashed_password });
    console.log("new_user:", new_user);
    console.log("new_user._id:", new_user._id);
    console.log("typeof new_user._id:", typeof new_user._id);
    try {
      await new_user.save();
      console.log("successful");
      res.json({ state: "successful", token });
    } catch (err) {
      console.log("sign up failed because:", err);

      res.json({ state: "failed", error: err });
    }
  }
});

app.post("/verify_token", async (req, res) => {
  let rule_out_token, decoded;

  // QQQ. ????????????????????????401???403??????????????????????????????
  try {
    //succeed
    //console.log("req.headers:", req.headers);
    //console.log("req.body:", req.body);
    rule_out_token = req.headers.authorization.replace("Bearer ", "");
    decoded = jwt.verify(rule_out_token, private_key);
  } catch (err) {
    //fail
    console.log("An error occurred in verifying token: ", err);

    res.status(403).json({ state: "failed verifying token" });
    return;
  }
  const new_token = jwt.sign(
    { provider: decoded.provider, name: decoded.name, email: decoded.email },
    private_key,
    { expiresIn: "24h" }
  );
  console.log("signed in already; sent renewed token");
  res.status(200).json({
    state: "signed in already",
    new_token,
    personal_token: decoded.email,
  });
});

app.post("/signin", async (req, res) => {
  console.log("req.body: ");
  console.log(req.body);
  let { email, password } = req.body;
  const email_existed = await User.findOne({ email });
  console.log("req.headers:", req.headers);
  console.log("req.body:", req.body);

  if (!email_existed) {
    // please sign up first
    res.status(403).json({ state: "no such user, or input data is incorrect" });
  } else {
    const token = jwt.sign(
      {
        name: email_existed.name,
        email: email_existed.email,
        provider: email_existed.provider,
      },
      private_key,
      { expiresIn: "24h" }
    );
    //console.log("email_existed:", JSON.stringify(email_existed));
    const bcrypted_password = email_existed.password;
    // check password
    const is_valid = await bcrypt.compare(password, bcrypted_password);
    //console.log("is_valid:", is_valid);
    if (!is_valid) {
      res
        .status(403)
        .json({ state: "no such user, or input data is incorrect" });
    } else {
      res.status(200).json({ state: "successfully signed in!", token });
    }
  }
});

app.get("/ad_hoc_find", async (req, res) => {
  try {
    const result = await User.findOne({ name: "Mai Fuchigami" });
    res.send(`result: ${result}, result is true:, ${!!result}`);
  } catch (err) {
    res.send("delete failed");
  }
});

app.get("/review", async (req, res) => {
  // GET /review?id=id`
  const rid = req.query.id;
  const filter = { esid: rid };

  let result;
  try {
    const target_restaurant = await Restaurant.findOne(filter, "review").exec();
    if (!target_restaurant) {
      result = [];
      res.json({ state: "good but negative", code: 0, result });
    } else {
      result = target_restaurant;
      console.log("result", result);
      console.log("result", JSON.stringify(result));
      res.json({ state: "good positive", code: 1, result });
    }
  } catch (err) {
    console.log("an error occurred: ", err);
    res.status(404).json({ state: "failed", err });
    return;
  }

  //   {
  //    result.push({
  //     author: "Alex",
  //     title: "????????????",
  //     content: `?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  // `,
  //     time: Date.now(),
  //     rating: 4,
  //   });
  //   result.push({
  //     author: "Mai",
  //     title: "??????????????????",
  //     content: `???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  // `,
  //     time: Date.now(),
  //     rating: 5,
  //   });
  //   result.push({
  //     author: "Howard",
  //     title: "???????????????",
  //     content: `?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  // `,
  //     time: Date.now(),
  //     rating: 3,
  //   });
  //}
});

app.post("/review", async (req, res) => {
  console.log("req.body: ", req.body);
  const {
    restaurant_esid,
    restaurant_name,
    title,
    content,
    rating,
    personal_token,
  } = req.body;

  // verify JWT
  try {
    let rule_out_token = req.headers.authorization.replace("Bearer ", "");
    let decoded = jwt.verify(rule_out_token, private_key);
  } catch (err) {
    console.log("An error occurred in verifying token: ", err);
    res.status(403).json({ state: "failed verifying token" });
    return;
  }
  // QQQ. want to check if JWT decoded email matches email from req.body?

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
          time: Date.now(),
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
  /* 
  find restaurant with id in mongoDB
  if not found:
    create new restaurant data in mongoDB with esid, name
    insert comment, update score and number of review
  
  elif found:
    check if name matches id; fire a warning if not match
    insert comment, update score and number of review

  retrieve the result of inserting comment and res.json back
  */

  //
  const name = user_name;
  const time = cur_time;
  console.log("restaurant_esid: ", restaurant_esid);
  console.log("restaurant_name: ", restaurant_name);
  const response = { name, title, content, time, rating };
  res.status(200).json(response);
});

app.post("/search_es", async (req, res) => {
  const id = req.body.id;
  const name = req.body.field;
  console.log("id: ", id);
  const result = await elasticClient
    .search({
      index: INDEX_NAME,
      size: 1,
      query: {
        bool: { must: { match: id ? { place_id: id } : name ? { name } : "" } },
      },
    })
    .catch((err) => {
      res.status(500).json({ err, result: "search failed" });
      return;
    });
  console.log("result:", result);
  console.log("result:", JSON.stringify(result));
  res.json(result);
});

app.get("/campaign/:id", async (req, res) => {
  const selected_campaign = req.params.id;
  const name_field = "name";
  const rating_field = "rating";
  const reviews_field = "reviews.text";
  const address_field = "formatted_address";
  const price_field = "price_level";
  const campaign_list = [
    "???????????????",
    "?????????????????????",
    "????????????",
    "????????????",
    "???????????????",
    "????????????",
    "????????????",
  ];

  const campaign_query_dict = {};
  for (let i = 0; i < campaign_list.length; i++) {
    campaign_query_dict[`${i}`] = { title: `${campaign_list[i]}`, query: {} };
  }
  // campaign_query_dict[selected_campaign] = {
  //   title: "ith TITLE",
  //   query: {},
  // };
  campaign_query_dict[0].query = {
    must: {
      match: {
        [address_field]: "?????????",
      },
    },
  };
  campaign_query_dict[1].query = {
    must: {
      range: {
        [rating_field]: { gte: 4.3, boost: 4.0 },
      },
    },
  };
  campaign_query_dict[2].query = {
    must: {
      match: {
        [reviews_field]: "??????",
      },
    },
  };
  campaign_query_dict[3].query = {
    must: {
      match: {
        [reviews_field]: "??????",
      },
    },
  };
  campaign_query_dict[4].query = {
    must: [
      {
        match: {
          [reviews_field]: "?????????",
        },
      },
    ],
  };
  campaign_query_dict[5].query = {
    must: {
      range: {
        [price_field]: { lte: 1 },
      },
    },
  };
  campaign_query_dict[6].query = {
    should: [
      {
        match: {
          [reviews_field]: "??????",
        },
      },
      {
        match: {
          [reviews_field]: "??????",
        },
      },
    ],
  };

  console.log(
    `campaign_query_dict[${selected_campaign}]: `,
    campaign_query_dict[selected_campaign]
  );
  // campaign???????????????

  const result = await elasticClient
    .search({
      index: INDEX_NAME,
      size: 10,
      query: {
        bool: campaign_query_dict[selected_campaign].query,
      },
    })
    .catch((err) => {
      res.status(500).json({ err, result: "search failed" });
      return;
    });
  console.log("campaign result: ", result);
  res.json({
    result,
    campaign: {
      index: selected_campaign,
      selected_campaign: campaign_list[selected_campaign],
    },
  });
});

app.post("/search_experiment", async (req, res) => {
  //console.log(req.body);
  //console.log(Object.keys(req.body));
  const queries = req.body;
  const es_queries_obj = { must: [], must_not: [], should: [], filter: [] };
  // const q1 = req.body.first ? req.body.first : "??????";
  // const q2 = req.body.second ? req.body.second : "??????";
  // const q3 = req.body.third ? req.body.third : "2300";
  // console.log("queries:", q1, q2, q3);
  const name_field = "name";
  //const address_field = "formatted_address";
  const address_field = "address_components.long_name.keyword";
  const reviews_field = "reviews.text";
  const price_field = "price_level";
  const rating_field = "rating";
  const opening_field = "opening_hours.periods"; //incomplete

  // const q1_v = "??????";
  // const q2_k = "reviews.text";
  // const q2_v = "??????";
  // const q3_k = "reviews.text";
  // const q3_v = "??????";
  try {
    if (queries.name) {
      for (i of queries.name) {
        es_queries_obj.must.push({
          match: {
            [name_field]: i,
          },
        });
      }
    }
    if (queries.place) {
      for (i of queries.place) {
        es_queries_obj.filter.push({
          term: {
            [address_field]: i,
          },
        });
      }
    }
    if (queries.cuisine) {
      for (i of queries.cuisine) {
        es_queries_obj.must.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }
    if (queries.estab) {
      for (i of queries.estab) {
        es_queries_obj.must.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }
    if (queries.menu) {
      for (i of queries.menu) {
        es_queries_obj.must.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }
    if (queries.pricelv) {
      for (i of queries.pricelv) {
        es_queries_obj.filter.push({
          range: {
            [price_field]: { lte: i.length },
          },
        });
      }
    }
    if (queries.rating) {
      for (i of queries.rating) {
        if (i < 3) {
          es_queries_obj.filter.push({
            range: {
              [rating_field]: { lte: i, boost: 2.0 },
            },
          });
        } else {
          es_queries_obj.filter.push({
            range: {
              [rating_field]: { gte: i, boost: 2.0 },
            },
          });
        }
        // es_queries_obj.push({
        //   range: {
        //     [rating_field]: { gte: i, boost: 2.0 },
        //   },
        // });
      }
    }
    if (queries.ophour) {
      for (i of queries.ophour) {
        es_queries_obj.must.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }
    if (queries.amenit) {
      for (i of queries.amenit) {
        es_queries_obj.must.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }

    // incomplete
    // if (queries.opennow) {
    //   es_queries_list.push({
    //     match: {
    //       [opening_field]: queries.opennow,
    //     },
    //   });
    // }
  } catch (err) {
    console.log("an error occurred: ", err);
  }

  console.log(es_queries_obj);
  // const must_cond1 = {
  //   match: {
  //     [q1_k]: q1_v,
  //   },
  // };
  // const must_cond2 = {
  //   match: {
  //     [q2_k]: q2_v,
  //   },
  // };
  // const must_cond3 = {
  //   match: {
  //     [q3_k]: q3_v,
  //   },
  // };
  // ???????????????????????????
  const result = await elasticClient
    .search({
      index: INDEX_NAME,
      size: 64,
      //query: { match: { formatted_address: "?????????" } },
      query: {
        bool: es_queries_obj,
      },
      highlight: {
        pre_tags: ["<b>"],
        post_tags: ["</b>"],
        fields: {
          [reviews_field]: {},
        },
      },
    })
    .catch((err) => {
      res.json({ err, result: "search failed" });
      return;
    });
  res.json(result);
});

app.get("/gcnlpdemo", async (req, res) => {
  console.log("gcnlpdemo");
  const document = {
    type: "PLAIN_TEXT",
    language: "zh-Hant",
    // Union field source can be only one of the following:
    content: "????????????????????? ???????????????????????? ??????????????????",
    // End of list of possible types for union field source.
  };

  const [result] = await languageClient.analyzeSentiment({
    document: document,
  });

  const sentiment = result.documentSentiment;

  console.log(`Text: ${document.content}`);
  console.log(`Sentiment score: ${sentiment.score}`);
  console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
  res.status(200).json({ text: document, sentiment: sentiment });
});

app.get("/pydemo", async (req, res) => {
  const python = spawn("python3", ["hw.py", "Fuchigami san"]);
  python.stdout.on("data", (data) => {
    const msg = "logging output:" + data.toString() + "\n";
    console.log(msg);
  });
  python.stderr.on("data", (data) => {
    console.log(`An error happened: ${data}`);
    res.status(502).send(data);
    return;
  });
  python.on("close", (code) => {
    const msg = `child process exit with status code ${code}`;
    console.log(msg);
    res.status(200).send(msg);
    return;
  });
});

app.post("/es_search", async (req, res) => {
  res.json({ name: "restaurant1", star: 4.2, tag: "?????????" });
});

// app.get("/get_photo_from_google", async (req, res) => {
//   // axios({
//   //   method: "get",
//   //   url: "http://bit.ly/2mTM3nY",
//   //   responseType: "stream",
//   // }).then(function (response) {
//   //   response.data.pipe(fs.createWriteStream("ada_lovelace.jpg"));
//   // });
//   const gmaps_key = process.env.GOOGLE_MAPS_API_KEY;
//   const photo = await axios
//     .get(
//       `https://maps.googleapis.com/maps/api/place/photo?photo_reference=AeJbb3f_2-nRsfQaKaaDIBZH9zKDDbZwBa3Hmcq_NxCaaotQeDp-RhFdSmwxKF2KMNullvl0U2bLn-vcSLn-27Lk3V8r698eU-sDngwCZidMcdG8f9gpzlVEDnwSFBvhTcYX1el6VNK40w_GKBEKDxHZeOwMFVm5loptjPY4E7RM1OAhBfHW&key=${gmaps_key}&maxwidth=600`
//     )
//     .then(function (response) {
//       // handle success
//       console.log(response);
//     })
//     .catch(function (error) {
//       // handle error
//       console.log("error:", err);
//     });
// });

app.get("/", async (req, res) => {
  res.sendFile("search.html", { root: path.join(__dirname, "./" + public) });
});

app.listen(port, () => {
  console.log("The server is running on server");
});

//use this on terminal: export GOOGLE_APPLICATION_CREDENTIALS="../bustling-nomad-361302-e29175b9daac.json"
