const express = require("express");
const router = express.Router();
const { elasticClient } = require("../utils/db");

router.get("/:id", async (req, res) => {
  const selected_campaign = req.params.id;
  const name_field = "name";
  const rating_field = "rating";
  const reviews_field = "reviews.text";
  const address_field = "formatted_address";
  const price_field = "price_level";
  const campaign_list = [
    "台北市美食",
    "最受歡迎的餐廳",
    "提供外送",
    "日式美食",
    "吃到飽萬歲",
    "銅板美食",
    "氣氛滿分",
  ];
  const campaign_query_dict = {};
  for (let i = 0; i < campaign_list.length; i++) {
    campaign_query_dict[`${i}`] = { title: `${campaign_list[i]}`, query: {} };
  }
  campaign_query_dict[0].query = {
    must: {
      match: {
        [address_field]: "台北市",
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
        [reviews_field]: "外送",
      },
    },
  };
  campaign_query_dict[3].query = {
    must: {
      match: {
        [reviews_field]: "日式",
      },
    },
  };
  campaign_query_dict[4].query = {
    must: [
      {
        match: {
          [reviews_field]: "吃到飽",
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
          [reviews_field]: "氣氛",
        },
      },
      {
        match: {
          [reviews_field]: "浪漫",
        },
      },
    ],
  };

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
