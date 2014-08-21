'use strict';

//
// Integration tests for mongodb-rest.
//

var testDbName = 'mongodb_rest_test'
var testCollectionName = 'mongodb_test_collection'

var url = 'http://localhost:3000/';
var dbsUrl = url + 'dbs';
var collectionsUrl = url + testDbName;
var collectionUrl = collectionsUrl + '/' + testCollectionName;

var utils = require('./testutils');

var request = require('request');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

var load = utils.loadFixture;
var dropAndLoad = utils.dropDatabaseAndLoadFixture;
var dropDatabase = utils.dropDatabase;
var requestHttp = utils.requestHttp;
var requestJson = utils.requestJson;
var collectionJson = utils.collectionJson;
var itemJson = utils.itemJson;
var itemHttp = utils.itemHttp;
var post = utils.post;
var put = utils.put;
var del = utils.del;
var Q = require('q');
var extend = require("extend");

describe('mongodb-rest', function () {

    // Default configuration to use for some tests.
    var defaultConfiguration = {
        db: {
            port: 27017,
            host: "localhost"
        },
        server: {
            port: 3000,
            address: "0.0.0.0"
        },
        accessControl: {
            allowOrigin: "*",
            allowMethods: "GET,POST,PUT,DELETE,HEAD,OPTIONS"
        },
        mongoOptions: {
            serverOptions: {
            },
            dbOptions: {
                w: 1
            }
        },
        debug: true,
        humanReadableOutput: true,
        collectionOutputType: 'json',
    };

    var restServer = require('../server');

    var init = function (config, started) {

        // Open the rest server for each test.        
        restServer.startServer(config, started);
    };

    afterEach(function () {

        // Close the rest server after each test.
        restServer.stopServer();
    });

    it('can start server without server options', function (done) {

        var configurationNoServer = extend(true, {}, defaultConfiguration);
        delete configurationNoServer.server;

        expect(function () {
            init(configurationNoServer, done);
        }).not.toThrow();
    });

    it('can start server without server host or port', function (done) {

        var configurationNoServer = extend(true, {}, defaultConfiguration);
        delete configurationNoServer.server.address;
        delete configurationNoServer.server.port;

        expect(function () {
            init(configurationNoServer, done);
        }).not.toThrow();
    });

    it('can hit server without db options', function (done) {

        var configurationNoDb = extend(true, {}, defaultConfiguration);
        delete configurationNoDb.db.host;
        delete configurationNoDb.db.port;

        init(configurationNoDb, done);

        dropAndLoad(testDbName, testCollectionName, [])
            .then(function () {
                return collectionJson(collectionUrl);
            })
            .then(function (result) {
                expect(result.data).toEqual([])
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can retrieve names of databases', function (done) {

        init();

        dropDatabase(testDbName)
            .then(function () {
                return requestJson(dbsUrl);
            })
            .then(function (result) {                
                expect(result.data).not.toContain(testDbName);
            })
            .then(function () {
                return dropAndLoad(testDbName, testCollectionName, []);
            })
            .then(function () {
                return requestJson(dbsUrl);
            })
            .then(function (result) {
                expect(result.data).toContain(testDbName);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can retrieve names of collections', function (done) {

        init();

        var testcol1 = "testcol1";
        var testcol2 = "testcol2";

        dropDatabase(testDbName)
            .then(function () {
                return requestJson(collectionsUrl);
            })
            .then(function (result) {                
                expect(result.data.length).toBe(0);
            })
            .then(function () {
                return load(testDbName, testcol1, [ { blah: 1 } ]);
            })
            .then(function () {
                return load(testDbName, testcol2, [ { blah: 2 } ]);
            })
            .then(function () {
                return requestJson(collectionsUrl);
            })
            .then(function (result) {
                var collectionNames = result.data;
                expect(collectionNames.length).toBeGreaterThan(1);
                expect(collectionNames).toContain(testcol1);
                expect(collectionNames).toContain(testcol2);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('should retreive empty array from empty db collection', function (done) {

        init();

        dropAndLoad(testDbName, testCollectionName, [])
            .then(function () {
                return collectionJson(collectionUrl);
            })
            .then(function (result) {
                expect(result.data).toEqual([])
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can retreive array from db collection', function (done) {

        init();

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

        dropAndLoad(testDbName, testCollectionName, testData)
            .then(function () {
                return collectionJson(collectionUrl);
            })
            .then(function (result) {
                var data = result.data;
                expect(data.length).toBe(3);
                data.sort(function (a, b) { return a.item-b.item; }); // Sort results, can't guarantee order otherwise.
                expect(data[0].item).toBe(1);
                expect(data[1].item).toBe(2);
                expect(data[2].item).toBe(3);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can handle retreiving document from empty db collection', function (done) {

        init();

        dropAndLoad(testDbName, testCollectionName, [])
            .then(function () {
                var itemID = ObjectID();
                return itemJson(collectionUrl, itemID);
            })
            .then(function (result) {
                expect(result.response.statusCode).toBe(404);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can handle retreiving non-existent document from non-empty db collection', function (done) {

        init();

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

        dropAndLoad(testDbName, testCollectionName, [])
            .then(function () {
                return itemHttp(collectionUrl, itemID);
            })
            .then(function (result) {
                expect(result.response.statusCode).toBe(404);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can retreive csv format data from db collection', function (done) {

        var csvConfiguration = extend(true, {}, defaultConfiguration);
        csvConfiguration.collectionOutputType = 'csv';

        init(csvConfiguration);

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

        dropAndLoad(testDbName, testCollectionName, testData)
            .then(function () {
                return requestHttp(collectionUrl);
            })
            .then(function (result) {



                var lines = result.data.trim().split('\r\n');
                expect(lines.length).toBe(4);

                var headerRow = lines[0].split(',');
                expect(headerRow[0]).toEqual("\"item\"");
                expect(headerRow[1]).toEqual("\"_id\"");

                lines.shift(); // Remove header line.
                var items = lines.map(function (line) {
                    var columns = line.split(',');
                    return {
                        item: parseInt(columns[0].substring(1,columns[0].length-1)),
                    };
                });

                items.sort(function (a, b) { return a.item-b.item; }); // Sort results, can't guarantee order otherwise.

                expect(items[0].item).toBe(1);
                expect(items[1].item).toBe(2);
                expect(items[2].item).toBe(3);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can retreive single document from db collection', function (done) {

        init();

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

        dropAndLoad(testDbName, testCollectionName, testData)
            .then(function () {
                return itemJson(collectionUrl, itemID);
            })
            .then(function (result) {
                expect(result.data._id).toEqual(itemID.toString());
                expect(result.data.item).toBe(2);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can insert single document into collection', function (done) {

        init();

        var postData = {
            value: "hi there",
        };

        dropDatabase(testDbName)
            .then(function () {
                return post(collectionUrl, postData);
            })
            .then(function (result) {
                expect(result.response.statusCode).toBe(201);
                expect(result.data).toEqual({ ok: 1 });

                return collectionJson(collectionUrl);
            })
            .then(function (result) {
                expect(result.data.length).toBe(1);
                expect(result.data[0].value).toBe(postData.value);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can update single document in db collection', function (done) {

        init();

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

        dropAndLoad(testDbName, testCollectionName, testData)
            .then(function () {

                var newData = {
                    item: 50,
                };

                return put(collectionUrl, itemID, newData);
            })
            .then(function (result) {
                expect(result.response.statusCode).toBe(200);
                expect(result.data).toEqual({ ok: 1 });

                return itemJson(collectionUrl, itemID);
            })
            .then(function (result) {
                expect(result.data._id).toEqual(itemID.toString());
                expect(result.data.item).toBe(50);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('can delete single document in db collection', function (done) {

        init();

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

        dropAndLoad(testDbName, testCollectionName, testData)
            .then(function () {
                return del(collectionUrl, itemID);
            })
            .then(function (result) {
                expect(result.response.statusCode).toBe(200);
                expect(JSON.parse(result.data)).toEqual({ ok: 1 });

                return itemJson(collectionUrl, itemID);
            })
            .then(function (result) {
                //todo: expect(result.response.statusCode).toBe(404);
                expect(result.data).toEqual({ ok: 0 });

                return collectionJson(collectionUrl);
            })
            .then(function (result) {
                expect(result.data.length).toBe(2);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });
});