const mongoose = require('mongoose');
const { Schema } = mongoose;

const routeSchema = new Schema({
  path: { type: String, required: false },
  endpoint_label: { type: String, required: false },
  external_url: { type: String, required: false },
  token :{type : String, requried:false}
}, { _id: false });

const appSchema = new Schema({
  app: { type: String, required: true },
  app_url: { type: String, required: false },
  token :{type : String, requried:false},
  routes: { type: [routeSchema], required: false },
}, { _id: false });

const serviceRegisterExternal = new Schema({
  workspace: { type: String, required: true },
  token :{type : String, requried:false},
  workspace_url: { type: String, required: false },
  apps: { type: [appSchema], required: false }

},{ strict: true , _id : false , __v : false});

const ServiceRegisterExternal = mongoose.model('service_register_external', serviceRegisterExternal);

module.exports = ServiceRegisterExternal;
