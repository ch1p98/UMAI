const asyncHandler = require("express-async-handler");
const { elasticClient } = require("../utils/db");

const getPlaceById = asyncHandler(async (req, res) => {
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

const getPlaces = asyncHandler(async (req, res) => {
  const queries = req.body;
  const es_queries_obj = { must: [], must_not: [], should: [], filter: [] };
  // const q1 = req.body.first ? req.body.first : "新北";
  // const q2 = req.body.second ? req.body.second : "花枝";
  // const q3 = req.body.third ? req.body.third : "2300";
  // console.log("queries:", q1, q2, q3);
  const name_field = "name";
  const address_field = "address_components.long_name.keyword";
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
  // 搜尋條件的搜尋結果
  const result = await elasticClient
    .search({
      index: INDEX_NAME,
      size: 64,
      //query: { match: { formatted_address: "仁愛路" } },
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

module.exports = {
  getPlaceById,
  getPlaces,
};
