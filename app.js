var db = require("./db/db")

var rest = require("./service/rest/rest-client")

// db.fetchMapping('facebook', 'chat').then((result) => {
//     console.log(" result " + JSON.stringify(result));
// }).catch((err) => {
//     console.log(err);
// });



// db.removeMapping('facebook', 'chat').then((result) => {
//     console.log(" result " + JSON.stringify(result));
// }).catch((err) => {
//     console.log(err);
// });

// db.addMapping('facebook', 'security', 'Secure Login', 'D', '/app/kc2/', null).then((result) => {
//     console.log(" result " + JSON.stringify(result));
// }).catch((err) => {
//     console.log(err);
// });

// var registy = {
//     action: "ADD",
//     workspace: "facebook",
//     app: "chat1",
//     host: "http://ns3172713.ip-151-106-32.eu",
//     port: 51501,
//     paths: [
//         {
//             path: "/modellerService/listWorkspaces",
//             endpoint_label: "Workspace Listing"
//         },
//         {
//             path: "/modellerService/listWorkspaces1",
//             endpoint_label: "Fake API to fail"
//         }

//     ]
// };

// db.addBulkMapping(registy).then((result) => {
//     console.log(" result " + JSON.stringify(result));
// }).catch((err) => {
//     console.log(err);
// });

// const produce = require("./kProducer")
// produce(registy).catch((err) => {
//     console.error("error in producer: ", err)
// });
var pData = {};
rest.post("http://ns3172713.ip-151-106-32.eu:51600/q/facebook/chatrooms/hello", null, pData).then(
    (data) => {
        // console.log(data);
    }
).catch((err) => {
    console.log(JSON.stringify(err));
});