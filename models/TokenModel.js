const mongoose = require('mongoose');

// Define the schema
const TokenSchema = new mongoose.Schema({
  workspace: {
    type: String,

  },
  app:{
    type: String,

  },
  token: {
    type: String,

  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Or define a more specific schema based on your variableJSON structure
   
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a model
module.exports  = mongoose.model('token', TokenSchema);
