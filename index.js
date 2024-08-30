console.log(process.env.NODE_ENV)


const express = require('express')
const app = express()
const mongoose =require("mongoose");
const _request = require('request');
const stream = require('stream');
const exceljs = require("exceljs");
var MongoClient = require("mongodb").MongoClient;
const {
  Parser,
  transforms: { unwind, flatten },
} = require("json2csv");
mongoose.pluralize(null);

const serviceregister = require("./models/serviceregister")
  

const cors = require('cors');

const consume = require("./service/kafka/kConsumer")
const produce = require("./service/kafka/kProducer");

const consumeAdvance = require("./service/kafka/kConsumerAdvance")
const produceAdvance = require("./service/kafka/kProduceAdvance")

const httpProxy = require('express-http-proxy')
const { json } = require('express/lib/response')

var db = require("./db/db")

const innnerConfig = require("./config/config");

const rest = require("./service/rest/rest-client");

const checkNodeEnv = require("./configService");
const { mongo } = require('mongoclient/config');
const { ConfigSource } = require('kafkajs');
const { Console } = require('console');
const { Timestamp } = require('mongodb');

const jwtService = require("./service/jwt/JWTService");

var config = checkNodeEnv();

const {
    app: { port, modellerForm, clusterIp, notifyMgr }
} = config;



/******************************************************************************************
 *
 * Aggregator  - Lator,Gators
 *
 *****************************************************************************************/

const {
    mongodb: { url, name,suffix },
    app: { ports }
  } = config;
  
  const connectionString = `mongodb://${url}/k1?authSource=admin`;
  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(connectionString)


  
const host = innnerConfig.proxy.host;
const proxy_suffix = innnerConfig.proxy.suffix;

const _url = `${host}${proxy_suffix}`;

app.use(cors());


app.get("/app-center/:workspace/apps", (req, res) => {

  let workspaceName = req.params.workspace;
  let devicesupport = req.headers['devicesupport'] ? req.headers['devicesupport'] : 'B';
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let perPage = req.query.perPage ? parseInt(req.query.perPage) : 10;
  let sortOrder= req.query.sortOrder; 
  let sortParam= req.query.sortParam;


    db.fetchDeployedApps(workspaceName, devicesupport,page,perPage,sortOrder,sortParam).then((result) => {

        if (result.length == 0) {
            res.status(404).send({ message: "No Routes Found" });
        } else {

            res.send({ data: { apps: result } });
        }

    }).catch((err) => {
        res.status(500).send({ message: "Something went wrong. Contact IF Administrtion" });
        console.log(err);
    });


});



//Get Context Paths for the APP within the workspace
app.get("/app-center/:workspace/:app/context", (req, res) => {

    let workspace = req.params.workspace;
    let app = req.params.app;
    let __url = req.protocol + '://' + req.get('host');
    let devicesupport = req.headers['devicesupport'] ? req.headers['devicesupport'] : 'B';

    let url = `${__url}/q/${workspace}/${app}`;

    db.fetchContext(workspace, devicesupport, app).then((result) => {

        if (result.length == 0) {
            res.status(404).send({ message: "No Routes Found" });
        } else {

            res.send({ data: { _url: url, _paths: result } });
        }

    }).catch((err) => {
        res.status(500).send({ message: "Something went wrong. Contact IF Administrtion" });
        console.log(err);
    });
});


//Get Context Paths for the APP within the workspace
app.get("/app-center/:workspace/:app/context", (req, res) => {

    let workspace = req.params.workspace;
    let app = req.params.app;

    let url = `${_url}/${workspace}/${app}`;

    db.fetchContext(workspace, app).then((result) => {

        if (result.length == 0) {
            res.status(404).send({ message: "No Routes Found" });
        } else {

            res.send({ data: { _url: url, _paths: result } });
        }

    }).catch((err) => {
        res.status(500).send({ message: "Something went wrong. Contact IF Administrtion" });
        console.log(err);
    });
});

//GET Notifications

//Get Context Paths for the APP within the workspace
app.get("/app-center/app/*", (req, res) => {

    let _target = req.originalUrl.substring(`/app-center/app/`.length);

    let _route = `${notifyMgr}/${_target}`;
    req.pipe(_request(_route)).pipe(res);

});

//Get Form Data
app.post("/app-center/:workspace/:app/:path/:pt/content", (req, res) => {

    let workspace = req.params.workspace;
    let app = req.params.app;
    let path = req.params.path;
    let taskType = req.params.pt;

    let data = {
        "workspace": workspace,
        "miniapp": app,
        "tasktype": taskType,
        "taskname": path
    };
    rest.post(modellerForm, null, data).then((pData) => {

        res.send({ data: pData });
    }).catch((err) => {
        res.status(500).send({ message: "Something went wrong. Contact IF Administrtion" });
        console.log(err);
    });

});

async function printKeys(obj, document, meta, prefix = '') {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newPrefix = prefix ? `${prefix}.${key}` : key;

      if (key === 'workspace') {
        meta['workspace'] = obj['workspace'];

        if (obj['action'] === 'generate') {
          const token = encodeURIComponent(await jwtService.generateEncryptedToken({ "workspace": meta['workspace'] }));
          obj['workspace_url'] = `https://api.tentoro.in/public/${meta['workspace']}?token=${token}`;
          obj['token'] = token;
        } else if (obj['action'] === 'noaction') {
          const _obj = fetchUrlsAndTokens(document, { workspace: meta['workspace'] });
          obj['workspace_url'] = _obj['workspace_url'];
          obj['token'] = _obj['token'];
        } else if (obj['action'] === 'delete') {
          obj['workspace_url'] = "";
          obj['token'] = "";
        }
        delete obj['action'];
      }

      if (key === 'app') {
        meta['app'] = obj['app'];

        if(obj['action'] === 'generate') {
          const token = encodeURIComponent(await jwtService.generateEncryptedToken({ "workspace": meta.workspace, "app": meta['app'] }));
          obj['app_url'] = `https://api.tentoro.in/public/${meta.workspace}/${meta['app']}?token=${token}`;
          obj['token'] = token;
        } else if(obj['action'] === 'noaction') {
          const _obj = fetchUrlsAndTokens(document, { workspace: meta['workspace'], app: meta['app'] });
          obj['app_url'] = _obj['app_url'];
          obj['token'] = _obj['token'];
        } else if(obj['action'] === 'delete') {
          obj['app_url'] = "";
          obj['token'] = "";
        }
        delete obj['action'];
      }

      if (key === 'path') {
        if (obj['action'] === 'generate') {
          const path = obj['path'];
          const token = encodeURIComponent(await jwtService.generateEncryptedToken({ "workspace": meta.workspace, "app": meta.app, "path": path }));
          obj['external_url'] = `https://api.tentoro.in/public/${meta.workspace}/${meta.app}/${path}?token=${token}`;
          obj['token'] = token;
        } else if (obj['action'] === 'noaction') {
          const _obj = fetchUrlsAndTokens(document, { workspace: meta['workspace'], app: meta['app'], path: obj['path'] });
          obj['external_url'] = _obj['external_url'];
          obj['token'] = _obj['token'];
        } else if (obj['action'] === 'delete') {
          obj['external_url'] = "";
          obj['token'] = "";
        }
        delete obj['action'];
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        await printKeys(value, document, meta, newPrefix);
      } else if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index++) {
          if (typeof value[index] === 'object' && value[index] !== null) {
            await printKeys(value[index], document, meta, `${newPrefix}[${index}]`);
          }
        }
      }
    }
  }

  return obj;
}


function fetchUrlsAndTokens(document , query) {
  const results = {};

  console.log("query document found : ",query);
  if(query.workspace && query.app && query.path){
    if (document && document.apps && Array.isArray(document.apps)) {
      console.log("document apps fournd " , document.apps);
      for(const app of document.apps){
        if( app.app === query.app){
          if(app.routes && Array.isArray(app.routes)){
            console.log("Routes found ", app.routes);
            for(const route of app.routes){
              if(route.path === query.path){
                 console.log("Route matched ",route.path);
                 results["external_url"] = route["external_url"];
                 results["token"] = route["token"];
                 results["path"] = route["path"];
                 break;
              }
            }
          }
          console.log("App found in the document. break this loop");
          break;
        }
      }
    }

  }else if(query.workspace && query.app){
    console.log("Apps are there ? ",(document && document.apps && Array.isArray(document.apps)));
    if (document && document.apps && Array.isArray(document.apps)) {
      for (const app of document.apps) {
        console.log("****************APP***************************");

        if (app.app === query.app) {
          results["app_url"] = app["app_url"];
          results["token"] = app["token"];
          break; 
        }
      }
    }

  }else if(query.workspace && document){

    results["workspace_url"] = document["workspace_url"];
    results["token"] = document["token"]

  }

  return results;
}

app.get('/app/access/apis' , express.json(), async (req,res)=>{

   try{

        // Fetching workspace from request headers
        const workspace = req.headers['workspace'];

  if (workspace) {
          const document = await db.fetchMergedRoutes(workspace);
          res.status(200).json(document);

    }else{
      res.status(500).json({message : `No records found for ${req.body.workspace}`});
    }

   }
    catch(err) {
      res.status(500).json({ message: "Something went wrong. Contact Administration" });
      console.log(err);
    }

});

app.post('/app/access/generate', express.json(), async (req, res) => {
  try {
    if (req.body.workspace) {
      var document = await db.fetchExternalApis(req.body.workspace);

      var variableJSON = await printKeys(req.body ,document , {} ,'');
      console.log("************************************Updated Doc************************************");
      console.log(JSON.stringify(variableJSON,null,3));
      console.log("***********************************************************************************");

      // Use the module to upsert the token entry
      var updatedDoc = await db.makePublicKeyEntryMultiple(variableJSON, "");
      console.log("************************************Result************************************");
      console.log(JSON.stringify(updatedDoc,null,3));
      console.log("***********************************************************************************");

      //Replace token logic to db.js
      // URL encode the `token` before appending it to the URL
      const encodedApiKey = encodeURIComponent("");
      res.status(201).json(updatedDoc);
    } else {
      res.status(404).json({ message: "Workspace name not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Contact Administration" });
    console.log(err);
  }
});

app.post('/app/fetch/apiDetails', express.json(), async (req, res) => {
  try {
    if (req.body.workspace) {
      var workspace = req.body.workspace;
      console.log(`workspace found = ${workspace}`);
      const apiDetails = await db.fetchApiDetails(workspace);

      res.status(201).json(apiDetails);
    } else {
      res.status(404).json({ message: "Workspace name not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Contact Administration" });
    console.log(err);
  }
});

app.get('/app/public/:workspace/apis/', express.json(), async (req, res) => {
  try {
    if (req.params.workspace) {
      var workspace = req.params.workspace;
      
     var results = await db.fetchAndTransformData(workspace);

      res.status(201).json(results);
    } else {
      res.status(404).json({ message: "Workspace name not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Contact Administration" });
    console.log(err);
  }
});


app.get('/public/applications', async (req, res) => {
  try {
    let { apikey } = req.query;
    console.log(`Received apikey = ${apikey}`);

    // Decode apikey if necessary (usually not required with Express)
    // apikey = decodeURIComponent(apikey);

    console.log(`Decoded apikey = ${apikey}`);
    const decryptedVariable = jwtService.decryptAndValidateToken(apikey);

    if (!decryptedVariable.valid) {
      res.status(500).json({ message: decryptedVariable.error });
    } else {
      const result = await db.fetchPublicAppAndContext(decryptedVariable.decoded.details);
      console.log("Result Fetched: " + JSON.stringify(result));
      
      if (result.length === 0) {
        res.status(404).json({ message: "No Public Apps Found" });
      } else {
        // Send the response with the result data
        res.status(200).json({ apps: result });
      }
    }
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Contact Administration" });
    console.log(err);
  }
});



/******************************************************************************************
 *
 * Route Configuration
 *
 *****************************************************************************************/

// Proxy request
const _url_path = "/q/:workspace/:app"
app.all(`${_url_path}/*`, async (req, res) => {

    let workspace = req.params.workspace;
    let app = req.params.app;
    let actionCategory = req.query.actionCategory;
    let _target = req.originalUrl.substring(`/q/${workspace}/${app}`.length);

    console.log("Workspace", workspace);
    console.log(req.body);
    console.log(req.headers.user);

    //lookup for the path in the service_register
    db.fetchHostAndPort(workspace, app).then(async (result) => {

        console.log("Result Fetched : " + JSON.stringify(result))
        if (result.length == 0) {
            res.status(404).send({ message: "No Routes Found" });
        } else {

            if (result) {


                let _route = `${result[0].host}:${result[0].port}/${_target}`;

                req.pipe(_request(_route)).on("data", function (data) {

                    //produce ActionInstanceEvent if exactly one argument is received as this is the behavior of Kogtio Initiation Proces
                    console.log("target before split " + _target);
                    if (req.query.actionCategory == "process") {

                        _response = JSON.parse(data.toString());
                        var event = {
                            processId: _response.id,
                            workspace: req.params.workspace,
                            app: req.params.app,
                            appDisplayName: result[0].appdisplayname ? result[0].appdisplayname : req.params.app,
                            initiatedBy: req.query.user,
                            type: "ActionInstanceEvent"
                        };
                        console.log(JSON.stringify(event));
                        produce("ifa-logs",event).catch((err) => {
                            console.log("*******************>>>>>><<<<<<<*******************");
                            console.log(err);
                            console.log("*******************>>>>>><<<<<<<*******************");
                        });

                    } else {
                        console.log("******************* Ignoring , as its no initiation process *******************");
                    }


                }).pipe(res);
                console.log("FIxed response");

            } else {
                res.status(404).send({ message: "Routes not determined" });
            }

        }

    }).catch((err) => {

        res.status(500).send({ message: "Something went wrong. Contact Administrtion" });
        console.log(err);

    });


});


app.get('/api/getHostAndPort', async (req, res) => {
  const { workspace, app } = req.query;

  try {
    const result = await db.fetchHostAndPort(workspace, app);
    console.log("Result Fetched: " + JSON.stringify(result));
    
    if (result.length === 0) {
      res.status(404).json({ message: "No Routes Found" });
    } else {
      // Send the response with the result data
      res.status(200).json(result);
    }
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Contact Administration" });
    console.log(err);
  }
});

// POST route to push the body to Kafka topic
app.post("/api/produce/:workspace/:app/:path", async (req, res) => {
  
  try {
    const _body = req.body;
    const message =  {
      workspace: req.params.workspace,
      app: req.params.app,
      path:req.params.path // Convert message to string before sending
    };

    produceAdvance("iot-topic",message).catch((err) => {
      console.log("*******************>>>>>><<<<<<<*******************");
      console.log(err);
      console.log("*******************>>>>>><<<<<<<*******************");
  });


    console.log("Message sent to Kafka:", message);
    res.status(200).send("Message successfully pushed to Kafka");
  } catch (error) {
    console.error("Error pushing message to Kafka:", error);
    res.status(500).send("Failed to push message to Kafka");
  }
});


//start REST Api server
app.listen(port, () => {
    console.log(`Router app listening on port ${port}`)
})

/******************************************************************************************
 *
 * Mock Operations
 *
 *****************************************************************************************/

//Get Context Paths for the APP within the workspace
app.get("/base/definitions", (req, res) => {

    var response =

    {
        workspace: "facebook",
        app: "ChatRooms",
        paths: [
            {
                endpoint_label: "Apply Leave",
                path: "leave-apply"
            }, {
                endpoint_label: "Reject Leave",
                path: "leave-reject"
            }]

    };

    res.status(200).send(response);
});

/******************************************************************************************
 *
 * KAFKA Operations
 *
 *****************************************************************************************/


var updateRegistery = function (message) {

    try {

        if (message.port) {

            let _base_definition_url = clusterIp + ":" + message.port + innnerConfig.base._app_url
            console.log(_base_definition_url);

            rest.get(_base_definition_url, null, {}).then((data) => {


                console.log("API call Data rcvd : " + JSON.stringify(data))

                data.host = clusterIp;
                data.port = message.port;

                db.addBulkMapping(data)
                    .then((result) => {
                        console.log("Test", JSON.stringify(result));
                    })
                    .catch((err) => {
                        console.log(err);
                    });


            }).catch((err) => {
                console.log(err);
            });

        }

    } catch (e) {
        console.log(e);
    }

}

var triggerApi = async function (message) {
  try {

    db.fetchHostAndPort(message.workspace ,message.app).then((data)=>{

      if (data) {
        serviceData = data[0];
        console.log("Service Data Found: ", JSON.stringify(serviceData));

        // Construct the URL for the API call
        let apiUrl = `${serviceData.host}:${serviceData.port}/${message.path}`; // Replace /your_api_endpoint with the correct endpoint

        // Make the API call using axios
            // Make the POST API call using axios
            rest.post(apiUrl, null , message.data)  // message.data is sent as the body of the POST request
                .then((response) => {
                    console.log("API call successful. Data received: ", response.data);

                })
                .catch((error) => {
                    console.error("Error during API call: ", error);
                });

    } else {
        console.log("No service data found for the given criteria.");
    }

    }).catch((err)=>{
      console.log("Error occured while processing the request");
      console.log(err);
    });

  } catch (error) {
      console.error("Error in triggerApi: ", error);
  }
};


consumeAdvance(updateRegistery,triggerApi).catch((err) => {
  console.error("error in consumer: ", err)
});

// start the consumer, and log any errors
/**consume(updateRegistery).catch((err) => {
    console.error("error in consumer: ", err)
});*/






async function getDataForstream(data) {
    var records = [];
    const csvFields = [];
    data.forEach((obj) => {
      records.push(obj);
    });
    let count = 0;
    for (var key in data) {
      if (count > 0) {
        break;
      }
      if (count == 0) {
        for (var keyOfKey in data[key]) {
          csvFields.push(keyOfKey);
        }
        count++;
      }
    }
    const transforms = [unwind({ paths: csvFields }), flatten(".")];
    const csvParser = new Parser({
      csvFields,
      transforms,
    });
    return csvParser.parse(records);
  }
  

  
  app.post("/:workspace/:app/:datamodel", express.json(),async function (req, res) {
  //will fetch the datamodel info from db and will download the datagrid
    var workspace = req.params.workspace;
    var app = req.params.app;
    var datamodel = req.params.datamodel;
    var reqBody = req.body;
    
    const connectionString = `mongodb://${url}`;
    const client = new MongoClient(connectionString);
    const database = client.db(workspace+"-"+app);
    const collection = database.collection(datamodel);
    var cursor = collection.find({});
    var storedata = await cursor.toArray();
  
    if(storedata.length>0){
      var newData = storedata.map((item) => {
        let tempItem = {}
        Object.keys(item).map((key,) => {
 
          tempItem = { ...tempItem, [reqBody[key] ?? key]: item[key] }
        })
        return tempItem
      })
    
      var splitData = await getDataForstream(newData);
    
      var data = splitData.split("\n");
      const workBook = new exceljs.Workbook();
      const workSheet = workBook.addWorksheet(workspace + "" + app);
      var columns = [];
      var headers = data[0].trim().replace(/["]/g, "").split(",");
      for (var key in headers) {
        columns.push({ header: headers[key], key: headers[key], width: 20 });
      }
      workSheet.columns = columns;
      for (var key in data) {
        if (key == 0) continue;
        var value = data[key].trim().replace(/["]/g, "").split(",");
        var element = {};
        for (var eleKey in headers) {
          element[headers[eleKey]] = value[eleKey];
        }
        workSheet.addRow(element);
      }
      workSheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=` + workspace + "" + app + `.xlsx`
      );
    
      const fileStream = new stream.PassThrough();
    
      res.writeable = true;
      fileStream.pipe(res);
      await workBook.xlsx.write(fileStream);
      fileStream.end();
    }
    else{
      res.status(400).send({message:"No Data Available for "+datamodel});
    }
  
  });

app.post("/:processid",async function (req, res){
     
    var processid = req.params.processid;

    const connectionString = `mongodb://${url}`;
    const client = new MongoClient(connectionString);
    const database = client.db("k1");
    const collection = database.collection("processEvents");
  
    const info = collection
    .find({
        "data.id": processid,
      })
      .project({ "data.error.errorMessage": 1 })
  
      const errorMessageArray = await info.toArray();
      if (errorMessageArray.length === 0 || !errorMessageArray[0].data || Object.keys(errorMessageArray[0].data).length === 0) {
    
        res.status(204).json({ message: "No errors found in workflow" }) ;
      } else {
        res.json(errorMessageArray);
      }

  });




