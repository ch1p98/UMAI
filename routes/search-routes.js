const express = require("express");
const router = express.Router();
const { getPlaceById, getPlaces } = require("../controllers/search");
router.post("/single", getPlaceById);

router.post("/whole", getPlaces);
