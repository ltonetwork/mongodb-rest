'use strict';

//
// Integration tests for authentication.
//

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
        auth: {
            usersDBConnection: "mongodb://localhost:3000/mongodb_rest_test_auth",
            tokenDBConnection: "mongodb://localhost:3000/mongodb_rest_test_auth",
            universalAuthToken: "universal-token",

        },
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

    describe('login', function () {

        it("when the user doesn't exist", function () {

        });

        it("when password isn't correct", function () {

        });
        
        it("when there is no existing token", function () {

        });

        it("when there is an existing token", function () {

        });
        
        it("when there is an expired token", function () {

        });
    });

    describe("get collection", function ()
    {
        it("can't get with no token", function () {

        });

        it("can't get with invalid token", function () {

        });

        it("can get with valid token", function () {

        });

        it("can get with universal auth token", function () {

        });
    });

    describe("post", function ()
    {
        it("can't post with no token", function () {

        });

        it("can't post with invalid token", function () {

        });

        it("can post with valid token", function () {

        });

        it("can post with universal auth token", function () {

        });
    });

    describe("logout", function ()
    {
        it("when logged in", function () {

        });

        it("when not logged in", function () {

        });
    });
});