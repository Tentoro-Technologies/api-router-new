const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the route schema
const routeSchema = new Schema({
  path: { type: String, required: false },
  endpoint_label: { type: String, required: false },
  external_url: { type: String, required: false },
  token: { type: String, required: false } // Fixed typo: requried -> required
}, { _id: false });

// Define the app schema
const appSchema = new Schema({
  app: { type: String, required: true },
  app_url: { type: String, required: false },
  token: { type: String, required: false }, // Fixed typo: requried -> required
  routes: { type: [routeSchema], required: false }
}, { _id: false });

// Define the main schema for service_register_external
const serviceRegisterExternal = new Schema({
  workspace: { type: String, required: true },
  token: { type: String, required: false }, // Fixed typo: requried -> required
  workspace_url: { type: String, required: false },
  apps: { type: [appSchema], required: false }
}, { 
  strict: true, 
  versionKey: false, // Use versionKey: false to avoid storing __v
  _id: false
});

// Export the model
module.exports = mongoose.model('service_register_external', serviceRegisterExternal);
