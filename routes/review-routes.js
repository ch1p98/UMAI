const express = require("express");
const router = express.Router();
const { getReview, postReview } = require("../controllers/review");

router.get("/", getReview);

router.post("/", postReview);
