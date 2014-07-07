'use strict';

//
// Integration tests for mongodb-rest.
//

var mongojs = require('mongojs');
var testDbName = 'mongodb_rest_test'
var testCollectionName = 'mongodb_test_collection'
var async = require('async');
var request = require('request');

var url = 'http://localhost:3000/';
var collectionUrl = url + testDbName + '/' + testCollectionName;

var loadFixture = function (data, done) {    
    var db = mongojs(testDbName);

    db.dropDatabase(function (err) {

        if (err) {
            db.close();
            done(err);
            return;
        }

        db.createCollection(testCollectionName, function (err, collection) {
            if (err) {
                db.close();
                done(err);
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
                    done(err);
                }
            );
        });
    });
};

var requestJson = function (url, done) {
    request(url, function (err, response, body) {
        if (err) {
            done(err);
            return;
        }

        var result = JSON.parse(body);
        done(null, result);
    });
};

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

        loadFixture([], function () {

            requestJson(collectionUrl, function (err, result) {
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