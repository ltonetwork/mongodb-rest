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
                expect(result[0].item).toBe(1);
                expect(result[1].item).toBe(2);
                expect(result[2].item).toBe(3);
                done();
            });
        });

    });
});