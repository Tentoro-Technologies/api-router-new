
const request = require('request-promise-native')
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
                        produce(event).catch((err) => {
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

// start the consumer, and log any errors
consume(updateRegistery).catch((err) => {
    console.error("error in consumer: ", err)
});






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



