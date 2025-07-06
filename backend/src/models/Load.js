const mongoose = require("mongoose");

const loadSchema = new mongoose.Schema({
  
});

const Load = mongoose.model("Load", loadSchema);

module.exports = Load;
