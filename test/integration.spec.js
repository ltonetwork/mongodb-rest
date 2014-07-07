'use strict';

//
// Integration tests for mongodb-rest.
//

var testDbName = 'mongodb_rest_test'
var testCollectionName = 'mongodb_test_collection'

var url = 'http://localhost:3000/';
var collectionUrl = url + testDbName + '/' + testCollectionName;

var utils = require('./testutils');

describe('mongodb-rest', function () {

    var restServer;

    beforeEach(function () {

        // Load rest server.
        restServer = require('../server');
    });

    afterEach(function () {

        // Close the rest server after each test.
        restServer.server.close();
        restServer = null;
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

});