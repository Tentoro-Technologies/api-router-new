require('dotenv').config();
var config = {
  development: {
    app : {
      port: 51605,
      modellerForm: "http://localhost:51501/modellerService/form/content",
      clusterIp: "http://ifs.svc.io",
      notifyMgr: "http://localhost:51603/app"
    },
    kafka:{
      host:"localhost",
      port:"9092"
    },
   
    mongodb: {
      url: "127.0.0.1:27017",
      name: "k1"
    }
    
    
  },
  production: {
    app : {
      port: process.env.DEV_PORT,
      modellerForm: process.env.DEV_MODELLER_FORM,
      clusterIp: process.env.DEV_MODELLER_KUBE_CLUSTER_IP,
      notifyMgr: process.env.DEV_NOTIFICATION_MGR
    },
    kafka:{
      host: process.env.DEV_KAFKA_URL,
      port: process.env.DEV_KAFKA_PORT
    },
   
    mongodb: {
      url: process.env.DEV_MONGO_USERNAME + ":" + process.env.DEV_MONGO_PASSWORD + "@" +
        process.env.DEV_MONGO_HOST + ":" + process.env.DEV_MONGO_PORT,
      name: process.env.DEV_MONGO_NAME
    }
    
  },
   colo: {
    app : {
      port: process.env.COLO_PORT,
      modellerForm: process.env.COLO_MODELLER_FORM,
      clusterIp: process.env.COLO_MODELLER_KUBE_CLUSTER_IP,
      notifyMgr: process.env.COLO_NOTIFICATION_MGR
    },
    kafka:{
      host: process.env.COLO_KAFKA_URL,
      port: process.env.COLO_KAFKA_PORT
    },
 
    mongodb: {
      url: process.env.COLO_MONGO_USERNAME + ":" + process.env.COLO_MONGO_PASSWORD + "@" +
        process.env.COLO_MONGO_HOST + ":" + process.env.COLO_MONGO_PORT,
      name: process.env.COLO_MONGO_NAME
    }
  },
  uat: {
    app : {
      port: process.env.UAT_PORT,
      modellerForm: process.env.UAT_MODELLER_FORM,
      clusterIp: process.env.UAT_MODELLER_KUBE_CLUSTER_IP,
      notifyMgr: process.env.UAT_NOTIFICATION_MGR
    },
    kafka:{
      host: process.env.UAT_KAFKA_URL,
      port: process.env.UAT_KAFKA_PORT
    },
   
    mongodb: {
      url: process.env.UAT_MONGO_USERNAME + ":" + process.env.UAT_MONGO_PASSWORD + "@" +
        process.env.UAT_MONGO_HOST + ":" + process.env.UAT_MONGO_PORT,
      name: process.env.UAT_MONGO_NAME
    }
  },
};

module.exports = config;