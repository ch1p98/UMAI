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

module.exports = { findFriend };
