const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    state: { type: String,default:"NA"},
    pincode: {
      type: Number,

    },
  },
  { timestamps: true }
);

const City = mongoose.model('City', citySchema);

module.exports = City;
