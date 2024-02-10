const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");
mongoose.pluralize(null);

const routerTableSchema = new mongoose.Schema({
  workspace: {
    type: String,
    required: true,
  },
  app: {
    type: String,
    required: true,
  },
  client_support: {
    type: String,
    default: "None",
  },
  appdisplayname: {
    type: String,
    default: "None",
  },
  path: {
    type: String,
    required: true,
  },
  endpoint_label: {
    type: String,
    default: "None",
  },
  host: {
    type: String,
    default: "None",  
  },
  port: {
    type: Number,
    default: "None",
  },
  registration_date: {
    type: Date,
    default: null,
  }
}, {
   versionKey: false
});


//routerTableSchema.index({ workspace: 1, app: 1 ,path:1}, { unique: true });

module.exports = mongoose.model("service_register", routerTableSchema);
