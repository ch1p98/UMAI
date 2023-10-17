require("dotenv").config();
const express = require("express");
const favicon = require("serve-favicon");
const path = require("path");
const app = express();
const public = "public";
app.use(express.static(public));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const jwt = require("jsonwebtoken");
const private_key = process.env.PRIVATE_KEY;
const cors = require("cors");
const bcrypt = require("bcrypt");
const port = 3000;
const INDEX_NAME = process.env.INDEX_NAME;
app.use(cors());
app.use(favicon(path.join(__dirname, "public", "mai.jpg")));

//const nsUser = mongoose.model("user", Any);
const friendRoutes = require("./routes/friend-routes");
const favoriteRoutes = require("./routes/favorite-routes");
const userRoutes = require("./routes/user-routes");
const reviewRoutes = require("./routes/review-routes");
const searchRoutes = require("./routes/search-routes");
const campaignRoutes = require("./routes/campaign-routes");

app.use("/friends", friendRoutes);
app.use("/favorite", favoriteRoutes);
app.use("/user", userRoutes);
app.use("/review", reviewRoutes);
app.use("/search", searchRoutes);
app.use("/campaign", campaignRoutes);

app.get("/", async (req, res) => {
  res.sendFile("search.html", { root: path.join(__dirname, "./" + public) });
});

app.listen(port, () => {
  console.log(`The server is running on port ${port}.`);
});

//use this on terminal: export GOOGLE_APPLICATION_CREDENTIALS="../bustling-nomad-361302-e29175b9daac.json"
