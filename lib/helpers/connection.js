/**
 * Functions to connect to database
 */

const MongoClient = require('mongodb').MongoClient;
var myDbs = {};

module.exports = {
    connect,
    connectPromise,
    getCollection,
    closeAll
}

//Connect to database
function connect(connStr, callback) {
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
}

//Connect, using Promise
function connectPromise(connStr) {
    if (myDbs[connStr] === undefined) {
        return MongoClient.connect(connStr).then(db => myDbs[connStr] = db);
    }

    return new Promise(function(resolve, reject) {
        resolve(myDbs[connStr]);
    });
}

//Connect to collection
function getCollection(db, collectionName) {
    return new Promise(function(resolve, reject) {
        db.collection(collectionName, function(error, collection) {
            error ? reject(error) : resolve(collection);
        });
    });
}

//Close all opened connections
function closeAll() {
    for (var key in myDbs) {
        if (myDbs.hasOwnProperty(key)) {
            myDbs[key].close();
        }
    }

    myDbs = {};
}
