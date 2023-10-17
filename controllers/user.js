require("dotenv").config();
const asyncHandler = require("express-async-handler");
const { User } = require("../utils/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const private_key = process.env.PRIVATE_KEY;

const getUserById = asyncHandler(async (req, res) => {
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
    if (!result) throw "No user data!!";
    else res.status(200).json({ state: "successful", result });
  } catch (err) {
    res.status(404).json({ state: "failed" }); //send an error
  }
});

const getUserFriends = asyncHandler(async (req, res) => {
  const people_arr = req.body.secondary_data_friend;
  const filter = { _id: { $in: people_arr } };
  const required_cols = "name age";
  const result = await User.find(filter, required_cols).exec();

  console.log("secondary_data_friend:", people_arr);
  console.log("result: ", result);
  //const result = await User.find(filter, required_cols);
  res.json({ requested_people_arr: people_arr, result });
});

const setProfile = asyncHandler(async (req, res) => {
  try {
    let rule_out_token = req.headers.authorization.replace("Bearer ", "");
    decoded = jwt.verify(rule_out_token, private_key);
  } catch (err) {
    //fail
    console.log("An error occurred in verifying token: ", err);

    res.status(403).json({ state: "failed verifying token" });
    return;
  }

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

const getProfile = asyncHandler(async (req, res) => {
  try {
    token = req.headers.authorization.replace("Bearer ", "");
    if (token === "null") throw "token is empty";
  } catch (err) {
    console.log("no token or token not correctly set");
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

const userSignUp = asyncHandler(async (req, res) => {
  console.log("req.body: ");
  console.log(req.body);
  let { name, email, password } = req.body;
  let user = { name, email, provider: "native" };
  const email_existed = await User.findOne({ email });
  if (email_existed) {
    // return error
    //console.log("email_existed: ", email_existed);
  } else {
    const token = jwt.sign(user, private_key, { expiresIn: "24h" });
    const hashed_password = await bcrypt.hash(password, 10);
    let new_user = new User({ name, email, password: hashed_password });
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

const userSignIn = asyncHandler(async (req, res) => {
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
    const hashed_password = email_existed.password;
    // check password
    const is_valid = await bcrypt.compare(password, hashed_password);
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

const verifyUser = asyncHandler(async (req, res) => {
  let rule_out_token, decoded;
  try {
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
  console.log("Signed in already; sent renewed token");
  res.status(200).json({
    state: "signed in already",
    new_token,
    personal_token: decoded.email,
  });
});

module.exports = {
  getUserById,
  getUserFriends,
  getProfile,
  setProfile,
  userSignUp,
  userSignIn,
  verifyUser,
};
