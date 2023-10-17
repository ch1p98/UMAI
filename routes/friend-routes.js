const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const { User } = require("../utils/db");
router.get("/", async (req, res) => {
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

  // token解出來的email跟前端給的email不合
  if (decoded.email !== email) {
    res.status(403).json({ state: "Invalid token" });
  }

  //uri: /friends?email=alextai@gmail%2Ecom
  const findFriend = User.aggregate([
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
  const result = await findFriend.exec();
  // result直接用(response.data)
  console.log(JSON.stringify(result));
  res.json(result);
});

// add an user to friend list
// req: Object_id
router.post("/", async (req, res) => {
  console.log("people who want to add someone else as friend:", req.body.ich);
  console.log("people to be added as friend:", req.body.sie);
  try {
    const new_friend = req.body.sie;
    const user = req.body.ich;
    console.log({ new_friend, user });
    const filter = { _id: user };
    const required_cols = "_id";
    const meExisting = await User.findOne(filter, required_cols).exec();
    console.log("meExisting: ", meExisting);
    if (meExisting) {
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
      // 我不存在
      const error_msg = `User with id ${user} does not exist.`;
      res.status(502).json({ error: error_msg });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.put("/", async (req, res) => {
  try {
    const del_friend = req.body.sie;
    const user = req.body.ich;
    const filter = { _id: user };
    const required_cols = "_id friend";
    const me = await User.findOne(filter, required_cols).exec();
    if (me) {
      me.friend.remove(del_friend);
      me.save();
      res.status(200).json({ me });
    } else {
      // 我不存在
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
