'use strict'; 

//
// Utils for testing.
//

var mongo = require('promised-mongo');
var request = require('request');
var Q = require('q');
var connection = require('../lib/connection');

//
// Drop the specified test database.
//
var dropDatabase = function (testDbName) {
    var db = mongo(testDbName);
    return db.dropDatabase()
        .then(function () {
            db.close(); 
        });
};

//
// Save a document and return a promise.
// This is a workaround, can't seem to do achieve this using the save fn in promised-mongo.
var saveDocument = function (collection, document) {
    var deferred = Q.defer();
    collection.save(document, function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(doc);
        }
    });
        
    return deferred.promise;
};

//
// Load data into a db collection.
// 
var loadFixture = function (testDbName, testCollectionName, data) {    

    var db = mongo(testDbName);
    return db.createCollection(testCollectionName)
        .then(function (collection) {
            return Q.all(data.map(function (dataItem) {
                return saveDocument(collection, dataItem);
            }));
        })
        .then(function () {
            db.close();
        });
};

//
// Load data into a db collection.
// 
var dropDatabaseAndLoadFixture = function (testDbName, testCollectionName, data) {    
    return dropDatabase(testDbName)
        .then(function () {
            return loadFixture(testDbName, testCollectionName, data);
        });
};

//
// Request http document from the rest api.
//
var requestHttp = function (url) {
    var deferred = Q.defer();

    request(url, function (err, response, body) {

        if (err) {
            deferred.reject(err);
            return;
        }

        deferred.resolve({ 
            data: body, 
            response: response,
        });
    });

    return deferred.promise;
};

//
// Request JSON from the rest api.
//
var requestJson = function (url) {
    var deferred = Q.defer();

    request(url, function (err, response, body) {
        if (err) {
            deferred.reject(err);
            return;
        }

        deferred.resolve({             
            data: JSON.parse(body), 
            response: response,
        });
    });

    return deferred.promise;
};

//
// Get a collection and run expectations on it.
//
var collectionJson = function (url) {
    return requestJson(url);
};

//
// Get an item from the db and run expectations on it.
//
var itemJson = function (collectionUrl, itemID) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    return requestJson(itemUrl);
};

//
// Get the response for a db item.
//
var itemHttp = function (collectionUrl, itemID) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    return requestHttp(itemUrl);
};

//
// Invoke a HTTP PUT.
//
var post = function (url, data) {
    var deferred = Q.defer();

    request.post({
            url: url, 
            json: true,
            body: data,
        },
        function (err, response, body) {
            if (err) {
                console.log('failing pormise');
                deferred.reject(err);
                return;
            }

            deferred.resolve({ 
                data: body,
                response: response,
            });
        }
    );

    return deferred.promise;
};

//
// Invoke a HTTP PUT.
//
var put = function (collectionUrl, itemID, data) {
    var deferred = Q.defer();
    var itemUrl = collectionUrl + "/" + itemID.toString();
    request.put({
        url: itemUrl, 
        json: data,
    }, function (err, response, body) {

        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve({
                data: body,
                response: response,
            });
        }
    });
    return deferred.promise;
};

//
// Inovke a HTTP DELETE.
//
var del = function (collectionUrl, itemID) {
    var deferred = Q.defer();
    var itemUrl = collectionUrl + "/" + itemID.toString();
    request.del({
        url: itemUrl, 
    }, function (err, response, body) {

        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve({
                data: body,
                response: response,
            });
        }
    });
    return deferred.promise;
};

var nextCollectionNumber = 1;
var nextDbNumber = 1;
var url = 'http://localhost:3000/';
var dbsUrl = url + 'dbs';

var restServer = require('../server');

module.exports = {
    dropDatabaseAndLoadFixture: dropDatabaseAndLoadFixture,
    dropDatabase: dropDatabase,
    loadFixture: loadFixture,
    requestHttp: requestHttp,
    requestJson: requestJson,
    collectionJson: collectionJson,
    itemJson: itemJson,
    itemHttp: itemHttp,
    post: post,
    put: put,
    del: del,

    // Start the rest server.
    startServer: function (config) {
        var deferred = Q.defer();

        // Open the rest server for each test.        
        restServer.startServer(config, function (err) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    },

    stopServer: function () {
        restServer.stopServer();
        connection.closeAll();
    },

    genDbsUrl: function () {
        return dbsUrl;
    },

    genTestDbName: function () {
        return 'mongodb_rest_test' + nextDbNumber++;
    },

    genTestCollectionName: function () {
        return 'mongodb_test_collection' + nextCollectionNumber++;
    },

    genCollectionsUrl: function (dbName) { 
        return url + dbName;
    },

    genCollectionUrl: function (dbName, collectionName) {
        return this.genCollectionsUrl(dbName) + '/' + collectionName;
    },

};
    