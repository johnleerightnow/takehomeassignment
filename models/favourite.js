const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      max: 100,
    },
    map: {
      type: Object,
      required: true,
    },
    default: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const favouriteModel = mongoose.model("favourite", favouriteSchema);

module.exports = favouriteModel;
