require("dotenv").config();
const express = require("express");
//
const favicon = require("serve-favicon");
const path = require("path");
//
const app = express();
app.use(express.static("public"));
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
app.use(favicon(path.join(__dirname, "public", "miho_icon.jpg")));
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
  email: {
    type: String,
  },
  // 入會時間
  date: {
    type: Date,
    default: Date.now,
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
  hobbies: {
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
  friends: {
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

const User = mongoose.model("user", UserSchema, "altUser");
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
    decoded = jwt.verify(rule_out_token, private_key);
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
  // console.log("email: ", email);
  const aggregate = User.aggregate([
    {
      $match: {
        email,
      },
    },
    {
      $project: {
        friends: 1,
        _id: 0,
      },
    },
    {
      $unwind: {
        path: "$friends",
      },
    },
    {
      $lookup: {
        from: "altUser",
        localField: "friends",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $project: {
        _id: "$friends",
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

  console.log(JSON.stringify(result));
  res.json(result);
});

// POST favorite
app.post("/favorite", async (req, res) => {
  const email = req.body.personal_token;
  const data = req.body.restaurant_obj;
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
  const filter = { email };
  const update = { $push: { favorite: { data } } };

  try {
    result = await User.findOneAndUpdate(filter, update, {
      new: true,
    }).exec();
    res
      .status(200)
      .json({ state: "successful append favorite to user data", result });
  } catch (err) {
    console.log("err in posting favorite: ", err);
    res.status(500).json({ err });
  }
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

app.get("/get_set_get_friend", async (req, res) => {
  const filter = { name: /Fuchigami/i };
  let users = await User.find(filter).exec();
  users = users.map((x) => (x._id ? x._id : "0"));
  console.log("found users: ", users);
  const target = { name: /alex/i };
  const update = { friends: users };
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
  // QQQ.你有要區分回401, 403嗎？ 現在只有403
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
  // token verified
  // QQQ.可能還要再對一下token資料跟前端頁面上的會員身份是否一致。
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
  try {
    let one = await User.findOne(
      { email: decoded.email },
      "-password -__v -_id"
    ).exec();
    if (!one) throw "No user data!!";
    res.status(200).json({ state: "successful", profile: one });
  } catch (err) {
    res.status(404).json({ state: "failed" }); //send an error
    return;
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

  // QQQ. 你這邊現在偷懶把401跟403放在一起，之後要改掉
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

app.post("/search_experiment", async (req, res) => {
  //console.log(req.body);
  //console.log(Object.keys(req.body));
  const queries = req.body;
  const es_queries_list = [];
  // const q1 = req.body.first ? req.body.first : "新北";
  // const q2 = req.body.second ? req.body.second : "花枝";
  // const q3 = req.body.third ? req.body.third : "2300";
  // console.log("queries:", q1, q2, q3);
  const address_field = "formatted_address";
  const reviews_field = "reviews.text";
  const price_field = "price_level";
  const rating_field = "rating";
  const opening_field = "opening_hours.periods"; //incomplete

  // const q1_v = "高雄";
  // const q2_k = "reviews.text";
  // const q2_v = "櫻花";
  // const q3_k = "reviews.text";
  // const q3_v = "炒飯";
  try {
    if (queries.place) {
      for (i of queries.place) {
        es_queries_list.push({
          match: {
            [address_field]: i,
          },
        });
      }
    }
    if (queries.exotic) {
      for (i of queries.exotic) {
        es_queries_list.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }
    if (queries.estab) {
      for (i of queries.estab) {
        es_queries_list.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }
    if (queries.menu) {
      for (i of queries.menu) {
        es_queries_list.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }
    if (queries.pricelv) {
      for (i of queries.pricelv) {
        es_queries_list.push({
          range: {
            [price_field]: { lte: i.length },
          },
        });
      }
    }
    if (queries.rating) {
      for (i of queries.rating) {
        if (i < 3) {
          es_queries_list.push({
            range: {
              [rating_field]: { lte: i, boost: 2.0 },
            },
          });
        } else {
          es_queries_list.push({
            range: {
              [rating_field]: { gte: i, boost: 2.0 },
            },
          });
        }

        es_queries_list.push({
          range: {
            [rating_field]: { gte: i, boost: 2.0 },
          },
        });
      }
    }
    if (queries.ophour) {
      for (i of queries.ophour) {
        es_queries_list.push({
          match: {
            [reviews_field]: i,
          },
        });
      }
    }
    if (queries.amenit) {
      for (i of queries.amenit) {
        es_queries_list.push({
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

  console.log(es_queries_list);
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
  const result = await elasticClient
    .search({
      index: "food_alpha",
      size: 100,
      //query: { match: { formatted_address: "仁愛路" } },
      query: {
        bool: {
          must: es_queries_list,
        },
      },
    })
    .catch((err) => {
      res.json({ error: err, result: "search failed" });
      return;
    });
  res.json(result);
});

// deprecated
app.get("/search_experiment", async (req, res) => {
  const result = await elasticClient
    .search({
      index: "food_alpha",
      size: 32,
      //query: { match: { formatted_address: "仁愛路" } },
      query: {
        bool: {
          must: [
            {
              match: {
                formatted_address: "高雄",
              },
            },
            {
              match: { "reviews.text": "櫻花" },
            },
            {
              match: { "opening_hours.periods.close.time": "2200" },
            },
          ],
        },
      },
    })
    .catch((err) => {
      res.json({ error: err, result: "search failed" });
    });
  res.json(result);
});

app.get("/gmaps-place-api", async (req, res) => {
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=25.0338,121.5646&radius=1000&keyword=牛排&language=zh-TW&key=${mapsKey}`;
});

app.get("/gcnlpdemo", async (req, res) => {
  console.log("gcnlpdemo");
  const document = {
    type: "PLAIN_TEXT",
    language: "zh-Hant",
    // Union field source can be only one of the following:
    content: "根本沒有看備註 備註寫請給我常溫 來的是燙的。",
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
  res.json({ name: "restaurant1", star: 4.2, tag: "店內價" });
});

app.get("/get_photo_from_google", async (req, res) => {
  // axios({
  //   method: "get",
  //   url: "http://bit.ly/2mTM3nY",
  //   responseType: "stream",
  // }).then(function (response) {
  //   response.data.pipe(fs.createWriteStream("ada_lovelace.jpg"));
  // });
  const gmaps_key = process.env.GOOGLE_MAPS_API_KEY;
  const photo = await axios
    .get(
      `https://maps.googleapis.com/maps/api/place/photo?photo_reference=AeJbb3f_2-nRsfQaKaaDIBZH9zKDDbZwBa3Hmcq_NxCaaotQeDp-RhFdSmwxKF2KMNullvl0U2bLn-vcSLn-27Lk3V8r698eU-sDngwCZidMcdG8f9gpzlVEDnwSFBvhTcYX1el6VNK40w_GKBEKDxHZeOwMFVm5loptjPY4E7RM1OAhBfHW&key=${gmaps_key}&maxwidth=600`
    )
    .then(function (response) {
      // handle success
      console.log(response);
    })
    .catch(function (error) {
      // handle error
      console.log("error:", err);
    });
});

app.listen(port, () => {
  console.log("The server is running on localhost:3000");
});

//use this on terminal: export GOOGLE_APPLICATION_CREDENTIALS="../bustling-nomad-361302-e29175b9daac.json"
