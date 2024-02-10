var Client = require("node-rest-client").Client;

var client = new Client();

module.exports.post = function (url, pHeaders, pData) {

    return new Promise(function (resolve, reject) {

        var args = {
            data: pData,// data passed to REST method (only useful in POST, PUT or PATCH methods)

            headers: { "Content-Type": "application/json" } // request headers
        };

        var req = client.post(url, args, function (data, response) {

            if (response.statusCode == 200 || response.statusCode == 201) {

                resolve(data);

            } else {

                reject({ status: response.statusCode, response: response.statusMessage });
            }

        });

        req.on('error', function (err) {
            console.log('request error', err);
        });

        req.on('requestTimeout', function (req) {
            console.log('request has expired');
            req.abort();
        });
        
        req.on('responseTimeout', function (res) {
            console.log('response has expired');
        
        });
    });

}

module.exports.get = function (url, pHeaders, pData) {

    return new Promise(function (resolve, reject) {

        var args = {
            data: pData,// data passed to REST method (only useful in POST, PUT or PATCH methods)

            headers: { "Content-Type": "application/json" } // request headers
        };

        var req = client.get(url, args, function (data, response) {

            if (response.statusCode == 200 || response.statusCode == 201) {

                resolve(data);

            } else {

                reject({ status: response.statusCode, response: response.statusMessage });
            }

        });

        req.on('error', function (err) {
            console.log('request error', err);
        });

        req.on('requestTimeout', function (req) {
            console.log('request has expired');
            req.abort();
        });
        
        req.on('responseTimeout', function (res) {
            console.log('response has expired');
        
        });

        
    });

}