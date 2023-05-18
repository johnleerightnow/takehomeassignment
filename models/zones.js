const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      max: 100,
    },
    order: { type: Number },
    position: Array,
    cleaning_round: Number,
    cleaning_duration: String,
    cleaning_preset: Object,
  },
  {
    timestamps: true,
  }
);

const zoneModel = mongoose.model("zone", zoneSchema);

module.exports = zoneModel;
