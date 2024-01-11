const mongoose = require("mongoose");

const RatingAndReview = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  rating: {
    type: Number,
    required: true,
  },
  review: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("RatingAndReview", RatingAndReview);
