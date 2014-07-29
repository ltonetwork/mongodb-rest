'use strict'; 

//
// Utils for testing.
//

var mongojs = require('mongojs');
var async = require('async');
var request = require('request');
var Q = require('q');

//
// Drop the specified test database.
//
var dropDatabase = function (testDbName) {
    var deferred = Q.defer();
    var db = mongojs(testDbName);

    db.dropDatabase(function (err) {

        db.close();

        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });

    return deferred.promise;
};

//
// Load data into a db collection.
// 
var loadFixture = function (testDbName, testCollectionName, data) {    
    var deferred = Q.defer();

    var db = mongojs(testDbName);

    db.createCollection(testCollectionName, function (err, collection) {
        if (err) {
            db.close();
            deferred.reject(err);
            return;
        }

        async.each(data, 
            // Single async operation.
            function (item, callback) {
                collection.save(item, callback);                        
            }, 
            // Callback after all items saved.
            function (err) {       
                db.close();
                if (err) {
                    deferred.reject(err);
                }
                else {
                    deferred.resolve();
                }
            }
        );
    });

    return deferred.promise;
};

//
// Load data into a db collection.
// 
var dropDatabaseAndLoadFixture = function (testDbName, testCollectionName, data) {    
    var deferred = Q.defer();

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
// Post an item and then retreive it back from db.
//
var post = function (url, data, done, expectations) {
    var deferred = Q.defer();

    request.post(
        {
            url: url, 
            json: data,
        }, 
        function (err, response, body) {
            if (err) {
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
// Update a db item then retrieve it back.
//
var put = function (collectionUrl, itemID, data, done, expectations) {
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
// Delete a db item then attempt to retrieve it back.
//
var del = function (collectionUrl, itemID, done, expectations) {
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
};
