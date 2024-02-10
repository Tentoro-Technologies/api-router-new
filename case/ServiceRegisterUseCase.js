const rest = require("./service/rest/rest-client")

module.exports = function (_kubeInfo) {

    if (registry && registry.port) {

        var pData = {};
        var url = "";
        rest.post(url, null, pData).then(
            (data) => {
                var entries = [];

                db.addBulkMapping(message)
                    .then((result) => {
                        console.log("Test2",JSON.stringify(result));
                    })
                    .catch((err) => {
                        console.log(err);
                    });


            }
        ).catch((err) => {
            console.log(JSON.stringify(err));
        });

    }

};

/**
 * 
 * {
 *      'workspace' : '',
 *      'app' : '',
 *       paths :{
 *          label : "",
 *           "path" : ""
 *       }
 * 
 * }
 * 
 */