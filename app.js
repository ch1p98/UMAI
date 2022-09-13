require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const { spawn } = require("child_process");
const { LanguageServiceClient } = require("@google-cloud/language").v1;
const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");

//const languageClient = new LanguageServiceClient({ credentials: creds });
const languageClient = new LanguageServiceClient();
//const mapsClient = new Client({});

// note how to deal with Client namespace here
//const { Client } = require("@googlemaps/google-maps-services-js");
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

const port = 3000;
app.use(cors());

app.get("");

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
