


const serviceregister = require("../models/serviceregister");
const res = require('express/lib/response');


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


 
module.exports.fetchDeployedApps = async function(
  workspace,
  devicesupport,
  page,
  perPage,
  sortOrder,
  sortParam
) {
  try {
    const startIndex = (page - 1) * perPage;

    const filter = {
      workspace: workspace,
      client_support: { $in: ["B", devicesupport] },
    };

    const sortOptions = {};

    if (sortOrder === "asc") {
      if (sortParam === "name") {
        sortOptions["appdisplayname"] = 1;
      } else {
        sortOptions["registration_date"] = 1;
      }
    } else if (sortOrder === "desc") {
      if (sortParam === "name") {
        sortOptions["appdisplayname"] = -1;
      } else {
        sortOptions["registration_date"] = -1;
      }
    }

    const aggregationPipeline = [
      { $match: filter },

      {
        $project: {
          _id: 0,
          workspace: 1,
          app: 1,
          appdisplayname: 1,
          registration_date: 1,
        },
      },

      {
        $group: {
          _id: {
            workspace: "$workspace",
            app: "$app",
          },

          data: {
            $push: {
              appdisplayname: "$appdisplayname",
              registration_date: "$registration_date",
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          workspace: "$_id.workspace",
          app: "$_id.app",
          data: 1,
        },
      },
    ];

    let countPipe = [...aggregationPipeline];

    aggregationPipeline.push({
      $skip: startIndex,
    });

    aggregationPipeline.push({
      $limit: perPage,
    });

    if (sortOptions && Object.keys(sortOptions).length > 0) {
      aggregationPipeline.push({
        $sort: sortOptions,
      });
    }

    const aggregationResult = await serviceregister
      .aggregate(aggregationPipeline)
      .allowDiskUse(true)
      .exec();

    countPipe.push({
      $count: "totalRecords",
    });

    let metaData = {};

    if (startIndex === "" || startIndex === 0) {
      var result = await serviceregister.aggregate(countPipe).exec();
      let totalCount = result[0].totalRecords;
      let totalPages = Math.ceil(totalCount / (perPage ? perPage : 10));
      metaData["totalCount"] = totalCount;
      metaData["totalPages"] = totalPages;
    }

    const transformedResult = aggregationResult.map((item) => ({
      workspace: item.workspace,
      app: item.app,
      appdisplayname: item.data[0].appdisplayname,
      registration_date: item.data[0].registration_date,
    }));

    let response = {};

    response["records"] = transformedResult;

    response["metaData"] = metaData;

    //Commenting the meta 
    //return response;
    return transformedResult;
  } catch (err) {
    throw err;
  }
};



module.exports.fetchMapping = async function (workspace, app) {

    try {
    const result = await serviceregister.find({
        workspace: workspace,
        app: app,
        client_support: { $in: ['B', 'B'] }
    }, {
        _id: 0,
        workspace: 1,
        app: 1,
        path: 1,
        port: 1
    }).exec();
    return result;
} catch (err) {
    throw err;
}

};

module.exports.fetchContext = async function (workspace, devicesupport, app) {
try{
    const result = await serviceregister.find({
        workspace: workspace,
        app: app,
        client_support: { $in: ['B', devicesupport] }
    }, {
        _id: 0,
        endpoint_label: 1,
        path: 1
    }).exec();
    return result;
}
 
 catch (err) {
    throw err;
}

};

module.exports.lookupContext = async function (workspace, app, path, device) {
try{
    const result = await serviceregister.find({
        workspace: workspace,
        app: app,
        client_support: { $in: [device, 'B'] },
        path: path
    }, {
        _id: 0,
        host: 1,
        port: 1,
        path: 1
    }).exec();
    return result
}
catch (err) {
    throw err;
}

};

module.exports.removeMapping = async function (workspace, app) {
try{
    const result = await serviceregister.deleteMany({
        workspace: workspace,
        app: app
    });
return result
}
catch (err) {
    throw err;
}
   
};

module.exports.addMapping = async function (workspace, app, endpoint_label, client_support, path, port) {


    const newService = new serviceregister({
        workspace: workspace,
        app: app,
        endpoint_label: endpoint_label,
        client_support: client_support,
        path: path,
        port: port,
        registration_date: registration_date
    });
    
    await newService.save();
    

};

//workspace, app, endpoint_label, client_support, path, port
module.exports.addBulkMapping = async function (registry) {
   	console.log("Registry before modification ");
	console.log();
	console.log(JSON.stringify(registry)); 
	console.log();
	//reg = registry.data;
	//registry = reg;
        console.log("BULK INSERT CALLED");
	console.log(JSON.stringify(registry));
        //let insertQueries = [];

        let workspace = registry.data.workspace;
        let app = registry.data.app;
        let port = registry.port;
        let host = registry.host;
        let client_support = registry.data.deviceSupport ? registry.data.deviceSupport : 'B';
        let appdisplayname = registry.data.appDisplayName ? registry.data.appDisplayName : registry.data.app;

        var contextPathList = registry.data.paths;

	console.log("Paths");
	console.log(contextPathList);
	const deleteFilter = {
                    workspace: workspace,
                    app: app
                };
                
         const deleteResult = await serviceregister.deleteMany(deleteFilter);
         console.log(deleteResult.deletedCount);

        for (var index in contextPathList) {
            console.log("Loaded Path:: " + JSON.stringify(contextPathList[index]));

            if (contextPathList[index]) {

                /*const deleteFilter = {
                    workspace: workspace,
                    app: app
                };
                
                const deleteResult = await serviceregister.deleteOne(deleteFilter);
                console.log(deleteResult.deletedCount);
                */
                
                const insertDocument = {
                    workspace: workspace,
                    app: app,
                    appdisplayname: appdisplayname,
                    endpoint_label: contextPathList[index].label,
                    client_support: client_support,
                    path: contextPathList[index].path,
                    host: host,
                    port: port,
                    registration_date: new Date()
                };
                
                const insertResult = await serviceregister.create(insertDocument);
               	console.log("Result and Data after data insert");
		console.log(JSON.stringify(insertDocument));
		await sleep(2000);
		 console.log(insertResult);
                

            }

        }
;
};


module.exports.fetchHostAndPort = async function (workspace, app) {
    try {
        const pipeline = [
            {
                $match: {
                    workspace: workspace,
                    app: app
                }
            },
            {
                $group: {
                    _id: {
                        workspace: '$workspace',
                        app: '$app'
                    },
                    host: { $first: '$host' },
                    port: { $first: '$port' },
                    appdisplayname: { $first: '$appdisplayname' }
                }
            },
            {
                $project: {
                    _id: 0, 
                    host: 1, 
                    port: 1, 
                    appdisplayname: 1 
                }
            }
        ];

        const cursor = await serviceregister.aggregate(pipeline);

        return cursor;


    } catch (error) {
        console.error('Error fetching host and port:', error);
        throw error;
    }
};


module.exports.fetchPublicAppAndContext = async function (filterValue) {
  try {
      console.log(`filterValue = ${JSON.stringify(filterValue)}`);
      const pipeline = [
        { $match :filterValue},
        {
          $group: {
            _id: {
              workspace: "$workspace",
              appDisplayName: "$appdisplayname"
            },
            endpoints: {
              $push: {endpoint :"$endpoint_label" , path :"$path"} // Collect all endpoint_labels for each unique workspace and appDisplayName
            }
          }
        },
        {
          $project: {
            _id: 0,
            workspace: "$_id.workspace",
            appDisplayName: "$_id.appDisplayName",
            endpoints: 1
          }
        }
      ];

      const cursor = await serviceregister.aggregate(pipeline);

      return cursor;


  } catch (error) {
      console.error('Error fetching host and port:', error);
      throw error;
  }
};