const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const { User } = require("../utils/db");

router.post("/", async (req, res) => {
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

router.get("/", async (req, res) => {
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

  // token解出來的email跟前端給的email不合
  console.log("email:", email);
  console.log("decoded email:", decoded.email);
  if (decoded.email !== email) {
    res.status(403).json({ state: "Invalid token" });
    return;
  }

  //uri: /friends?email=alextai@gmail%2Ecom
  // console.log("email: ", email);

  const result = await User.findOne({ email }, "favorite").exec();
  // 用result.favorite來接.(response.data)

  console.log(JSON.stringify(result));
  res.status(200).json(result);
});
