var MongoClient = require('mongodb').MongoClient;
var myDbs = {};

exports.connect = function (connStr, callback) {
    if (myDbs[connStr] === undefined) {
        MongoClient.connect(connStr, function (err, db) {
            if (err) {
                return callback(err);
            }

            myDbs[connStr] = db;

            callback(null, db);
        });
    } else {
        callback(null, myDbs[connStr]);
    }
};

exports.closeAll = function() {
    for(var key in myDbs) {
        if(myDbs.hasOwnProperty(key)) {
            myDbs[key].close();
        }
    }

    myDbs = { };
};