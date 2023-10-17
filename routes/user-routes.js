const express = require("express");
const router = express.Router();
const {
  getUserById,
  getUserFriends,
  getProfile,
  setProfile,
  userSignUp,
  userSignIn,
  verifyUser,
} = require("../controllers/user");

router.get("/:id", getUserById);

router.post("/people", getUserFriends);

router.post("/profile", setProfile);

router.get("/profile", getProfile);

router.post("/signup", userSignUp);

router.post("/signin", userSignIn);

router.post("/verify", verifyUser);
