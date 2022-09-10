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
const test = "test git config";

const port = 3000;

app.get("/search", async (req, res) => {
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
              match: { "opening_hours.periods.close.time": "2330" },
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

app.listen(port, () => {
  console.log("The server is running on localhost:3000");
});

//use this on terminal: export GOOGLE_APPLICATION_CREDENTIALS="../bustling-nomad-361302-e29175b9daac.json"
