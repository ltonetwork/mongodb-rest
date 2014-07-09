'use strict';

//
// Integration tests for mongodb-rest.
//

var testDbName = 'mongodb_rest_test'
var testCollectionName = 'mongodb_test_collection'

var url = 'http://localhost:3000/';
var collectionUrl = url + testDbName + '/' + testCollectionName;

var utils = require('./testutils');

// Start the rest server.
// Currently the server can't be restarted for each test.
var restServer = require('../server');

var request = require('request');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

var fixture = utils.loadFixture;
var dropDatabase = utils.dropDatabase;

//
// Get a collection and run expectations on it.
//
var collection = function (url, done, expectations) {

    utils.requestJson(collectionUrl, function (err, result) {
        if (err) {
            done(err);
            return;
        }


        expectations(result);
        done();
    });
};

//
// Get an item from the db and run expectations on it.
//
var item = function (url, itemID, done, expectations) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    utils.requestJson(itemUrl, function (err, result, response) {
        if (err) {
            done(err);
            return;
        }

        expectations(result, response);
        done();
    });
};

//
// Get the response for a rest api.
//
var response = function (url, done, expectations) {
    utils.request(url, function (err, result, response) {
        if (err) {
            done(err);
            return;
        }

        expectations(result, response);
        done();
    });
};

//
// Get the response for a db item.
//
var itemResponse = function (collectionUrl, itemID, done, expectations) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    response(itemUrl, done, expectations);
};

//
// Post an item and then retreive it back from db.
//
var post = function (url, data, done, expectations) {
    request.post(
        {
            url: url, 
            json: data,
        }, 
        function (err, response, body) {
            if (err) {
                done(err);
                return;
            }

            expect(response.statusCode).toBe(201);
            expect(body).toEqual({ ok: 1 });

            utils.requestJson(collectionUrl, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }

                expectations(result);
                done();
            });
        }
    );
};

//
// Update a db item then retrieve it back.
//
var put = function (collectionUrl, itemID, data, done, expectations) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    request.put({
        url: itemUrl, 
        json: data,
    }, function (err, response, body) {

        expect(response.statusCode).toBe(200);
        expect(body).toEqual({ ok: 1 });

        utils.requestJson(itemUrl, function (err, result) {
            if (err) {
                done(err);
                return;
            }

            expectations(result);
            done();
        });
    });
};

//
// Delete a db item then attempt to retrieve it back.
//
var del = function (collectionUrl, itemID, done, expectations) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    request.del({
        url: itemUrl, 
    }, function (err, response, body) {

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(body)).toEqual({ ok: 1 });

        utils.requestJson(itemUrl, function (err, result) {
            if (err) {
                done(err);
                return;
            }
            
            //todo: expect(response.statusCode).toBe(404);
            expect(result).toEqual({ ok: 0 });

            utils.requestJson(collectionUrl, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }

                expectations(result);
                done();
            });
        });
    });
};

describe('mongodb-rest', function () {

    //todo: var restServer;

    beforeEach(function () {

        // Open the rest server for each test.
        //todo: restServer = require('../server');
    });

    afterEach(function () {

        // Close the rest server after each test.
        //todo: restServer.server.close();
        //todo: restServer = null;
    });

    it('should retreive empty array from empty db collection', function (done) {

        fixture(testDbName, testCollectionName, [], function () {
            collection(collectionUrl, done, function (result) {
                expect(result).toEqual([])
            });
        });

    });

    it('can retreive array from db collection', function (done) {

        var testData = [
            {
                item: 1,
            },
            {
                item: 2,
            },
            {
                item: 3,
            },
        ];

        fixture(testDbName, testCollectionName, testData, function () {
            collection(collectionUrl, done, function (result) {
                expect(result.length).toBe(3);
                result.sort(function (a, b) { return a.item-b.item; }); // Sort results, can't guarantee order otherwise.
                expect(result[0].item).toBe(1);
                expect(result[1].item).toBe(2);
                expect(result[2].item).toBe(3);
            });
        });
    });

    it('can handle retreiving document from empty db collection', function (done) {

        fixture(testDbName, testCollectionName, [], function () {
            var itemID = ObjectID();
            item(collectionUrl, itemID, done, function (result, response) {
                expect(response.statusCode).toBe(404);
            });
        });

    });

    it('can handle retreiving non-existent document from non-empty db collection', function (done) {

        var itemID = ObjectID();

        var testData = [
            {
                _id: ObjectID(),
                item: 1,
            },
            {
                _id: ObjectID(),
                item: 2,
            },
            {
                _id: ObjectID(),
                item: 3,
            },
        ];

        fixture(testDbName, testCollectionName, [], function () {
            itemResponse(collectionUrl, itemID, done, function (result, response) {
                expect(response.statusCode).toBe(404);
            });
        });
    });

    it('can retreive single document from db collection', function (done) {

        var itemID = ObjectID();

        var testData = [
            {
                _id: ObjectID(),
                item: 1,
            },
            {
                _id: itemID,
                item: 2,
            },
            {
                _id: ObjectID(),
                item: 3,
            },
        ];

        fixture(testDbName, testCollectionName, testData, function () {
            item(collectionUrl, itemID, done, function (result, response) {
                expect(result._id).toEqual(itemID.toString());
                expect(result.item).toBe(2);
            });
        });
    });

    it('can insert single document into collection', function (done) {

        var postData = {
            value: "hi there",
        };

        dropDatabase(testDbName, function (err) {
            if (err) {
                done(err);
                return;
            }

            post(collectionUrl, postData, done, function (result) {
                expect(result.length).toBe(1);
                expect(result[0].value).toBe(postData.value);
            });
        });
    });

    it('can update single document in db collection', function (done) {

        var itemID = ObjectID();

        var testData = [
            {
                _id: ObjectID(),
                item: 1,
            },
            {
                _id: itemID,
                item: 2,
            },
            {
                _id: ObjectID(),
                item: 3,
            },
        ];

        fixture(testDbName, testCollectionName, testData, function () {

            var newData = {
                item: 50,
            };

            put(collectionUrl, itemID, newData, done, function (result) {
                expect(result._id).toEqual(itemID.toString());
                expect(result.item).toBe(50);
            });
        });
    });

    it('can delete single document in db collection', function (done) {

        var itemID = ObjectID();

        var testData = [
            {
                _id: ObjectID(),
                item: 1,
            },
            {
                _id: itemID,
                item: 2,
            },
            {
                _id: ObjectID(),
                item: 3,
            },
        ];

        fixture(testDbName, testCollectionName, testData, function () {
            del(collectionUrl, itemID, done, function (result) {
                expect(result.length).toBe(2);
            });
        });
    });
});