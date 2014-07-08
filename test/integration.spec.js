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

        utils.loadFixture(testDbName, testCollectionName, [], function () {

            utils.requestJson(collectionUrl, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                
                expect(result).toEqual([])
                done();
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

        utils.loadFixture(testDbName, testCollectionName, testData, function () {

            utils.requestJson(collectionUrl, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                
                expect(result.length).toBe(3);
                result.sort(function (a, b) { return a.item-b.item; }); // Sort results, can't guarantee order otherwise.
                expect(result[0].item).toBe(1);
                expect(result[1].item).toBe(2);
                expect(result[2].item).toBe(3);
                done();
            });
        });
    });

    it('can handle retreiving document from empty db collection', function (done) {

        var itemID = ObjectID();

        utils.loadFixture(testDbName, testCollectionName, [], function () {

            var itemUrl = collectionUrl + "/" + itemID.toString();
            utils.request(itemUrl, function (err, result, response) {

                if (err) {
                    done(err);
                    return;
                }

                expect(response.statusCode).toBe(404);
                done();
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

        utils.loadFixture(testDbName, testCollectionName, [], function () {

            var itemUrl = collectionUrl + "/" + itemID.toString();
            utils.request(itemUrl, function (err, result, response) {

                if (err) {
                    done(err);
                    return;
                }

                expect(response.statusCode).toBe(404);
                done();
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

        utils.loadFixture(testDbName, testCollectionName, testData, function () {

            var itemUrl = collectionUrl + "/" + itemID.toString();
            utils.requestJson(itemUrl, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }

                expect(result._id).toEqual(itemID.toString());
                expect(result.item).toBe(2);
                done();
            });
        });

    });

    it('can insert single document into collection', function (done) {

        var postData = {
            value: "hi there",
        };

        utils.dropDatabase(testDbName, function (err) {

            if (err) {
                done(err);
                return;
            }

            request.post({
                url: collectionUrl, 
                json: postData,
            }, function (err, response, body) {

                console.log('done!');

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

                    expect(result.length).toBe(1);
                    expect(result[0].value).toBe(postData.value);
                    done();
                });
            });
        });
    });

});