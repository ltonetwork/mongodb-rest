'use strict';
//
// Integration tests for authentication.
//

var test = require('./testutils');

describe('mongodb-rest', function () {

    var authDbName = 'mongodb_rest_test_auth';
    var authDbConnectionString = "mongodb://localhost/" + authDbName;
    var usersCollectionName = "users";
    var tokensCollectionName = "tokens"
    var baseUrl = 'http://localhost:3000/';
    var universalAuthToken = "universal-token";

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
        humanReadableOutput: true,
        collectionOutputType: 'json',
        auth: {
            usersDBConnection: authDbConnectionString,
            tokenDBConnection: authDbConnectionString,
            universalAuthToken: universalAuthToken,

        },
        logger: {
            info: function () {},
            warning: function () {},
            error: function () {},
            verbose: function () {},
        }
    };

    describe('login', function () {

        var loginUrl = baseUrl + "login";

        it('error when user not specified', function (done) {
            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabase(authDbName);
                })
                .then(function () {
                    // Login request.
                    return test.post(baseUrl + 'login', {
                        password: 'password-that-doesnt-matter',
                    });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(400);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it('error when password not specified', function (done) {
            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabase(authDbName);
                })
                .then(function () {
                    // Login request.
                    return test.post(baseUrl + 'login', {
                        username: 'username-that-doesnt-matter',
                    });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(400);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("fails when the user doesn't exist", function (done) {

            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabase(authDbName);
                })
                .then(function () {
                    // Login request.
                    return test.post(baseUrl + 'login', {
                        username: 'user-that-doesnt-exist',
                        password: 'password-that-doesnt-matter',
                    });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(401);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("fails when password isn't correct", function (done) {
            var userName = 'some-user';

            test.startServer(defaultConfiguration)
                .then(function () {
                    // Load user into auth db.
                    return test.dropDatabaseAndLoadFixture(authDbName, usersCollectionName, [
                            {
                                username: userName,
                                password: 'the-correct-password',
                            }
                    ]);
                })
                .then(function () {
                    // Login request.
                    return test.post(baseUrl + 'login', {
                        username: userName,
                        password: 'the-incorrect-password',
                    });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(401);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("can login when there is no existing token", function (done) {

            var userName = 'some-user';
            var password = 'some-password';

            test.startServer(defaultConfiguration)
                .then(function () {
                    // Load user into auth db.
                    return test.dropDatabaseAndLoadFixture(authDbName, usersCollectionName, [
                            {
                                username: userName,
                                password: password,
                            }
                    ]);
                })
                .then(function () {
                    // Login request.
                    return test.post(baseUrl + 'login', {
                        username: userName,
                        password: password,
                    });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(200);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("can login when there is an existing token reuses that token", function (done) {

            var userName = 'some-user';
            var password = 'some-password';
            var userId = 'user-id';
            var existingToken = 'token-id';

            test.startServer(defaultConfiguration)
                .then(function () {
                    // Load user into auth db.
                    return test.dropDatabaseAndLoadFixture(authDbName, usersCollectionName, [{
                        _id: userId,
                        username: userName,
                        password: password,
                    }]);
                })
                .then(function () {
                    return test.loadFixture(authDbName, tokensCollectionName, [{
                        token: existingToken,
                        userId: userId,
                        created: new Date(),
                    }]);
                })
                .then(function () {
                    // Login request.
                    return test.post(baseUrl + 'login', {
                        username: userName,
                        password: password,
                    });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(200);
                    expect(result.data.token).toBe(existingToken);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });
    });

    describe("get collection", function () {
        it("can't get with no token", function (done) {

            var dbName = test.genTestDbName();
            var collectionName = test.genTestCollectionName();
            var collectionUrl = test.genCollectionUrl(dbName, collectionName);

            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabaseAndLoadFixture(dbName, collectionName, [{
                        some: 'data',
                    }]);
                })
                .then(function () {
                    return test.collectionJson(collectionUrl);
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(401);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("can't get with invalid token", function (done) {

            var dbName = test.genTestDbName();
            var collectionName = test.genTestCollectionName();
            var collectionUrl = test.genCollectionUrl(dbName, collectionName) + '?token=invalid';

            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabaseAndLoadFixture(dbName, collectionName, [{
                        some: 'data',
                    }]);
                })
                .then(function () {
                    return test.collectionJson(collectionUrl);
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(401);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("can get with valid token", function (done) {

            var dbName = test.genTestDbName();
            var collectionName = test.genTestCollectionName();
            var collectionUrl = test.genCollectionUrl(dbName, collectionName) + '?token=1234';

            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabaseAndLoadFixture(authDbName, tokensCollectionName, [{
                        token: '1234',
                    }]);
                })
                .then(function () {
                    return test.dropDatabaseAndLoadFixture(dbName, collectionName, [{
                        some: 'data',
                    }]);
                })
                .then(function () {
                    return test.collectionJson(collectionUrl);
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(200);
                    expect(result.data.length).toBe(1);
                    expect(result.data[0].some).toBe('data');
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("can get with universal auth token", function (done) {
            var dbName = test.genTestDbName();
            var collectionName = test.genTestCollectionName();
            var collectionUrl = test.genCollectionUrl(dbName, collectionName) + '?token=' + universalAuthToken

            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabase(authDbName);
                })
                .then(function () {
                    return test.dropDatabaseAndLoadFixture(dbName, collectionName, [{
                        some: 'data',
                    }]);
                })
                .then(function () {
                    return test.collectionJson(collectionUrl);
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(200);
                    expect(result.data.length).toBe(1);
                    expect(result.data[0].some).toBe('data');
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });
    });

    describe("post", function () {
        it("can't post with no token", function (done) {
   
            var dbName = test.genTestDbName();
            var collectionName = test.genTestCollectionName();
            var collectionUrl = test.genCollectionUrl(dbName, collectionName);

            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabase(authDbName);
                })
                .then(function () {
                    return test.dropDatabase(dbName);
                })
                .then(function () {
                    return test.post(collectionUrl, { some: 'data' });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(401);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
      });

        it("can't post with invalid token", function (done) {

            var dbName = test.genTestDbName();
            var collectionName = test.genTestCollectionName();
            var collectionUrl = test.genCollectionUrl(dbName, collectionName) + '?token=invalid';

            test.startServer(defaultConfiguration)
                .then(function () {
                    return test.dropDatabase(authDbName);
                })
                .then(function () {
                    return test.dropDatabase(dbName);
                })
                .then(function () {
                    return test.post(collectionUrl, { some: 'data' });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(401);
                    done();                    
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("can post with valid token", function (done) {

            var dbName = test.genTestDbName();
            var collectionName = test.genTestCollectionName();
            var collectionUrl = test.genCollectionUrl(dbName, collectionName) + '?token=1234';

            test.startServer(defaultConfiguration)
               .then(function () {
                    return test.dropDatabaseAndLoadFixture(authDbName, tokensCollectionName, [{
                        token: '1234',
                    }]);
                })
                .then(function () {
                    return test.dropDatabase(dbName);
                })
                .then(function () {
                    return test.post(collectionUrl, { some: 'data' });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(201);
                })
                .then(function () {
                    return test.collectionJson(collectionUrl);
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(200); 
                    expect(result.data.length).toBe(1);
                    expect(result.data[0].some).toBe('data'); 
                    done();
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });

        it("can post with universal auth token", function (done) {

            var dbName = test.genTestDbName();
            var collectionName = test.genTestCollectionName();
            var collectionUrl = test.genCollectionUrl(dbName, collectionName) + '?token=' + universalAuthToken;

            test.startServer(defaultConfiguration)
               .then(function () {
                    return test.dropDatabase(authDbName);
                })
                .then(function () {
                    return test.dropDatabase(dbName);
                })
                .then(function () {
                    return test.post(collectionUrl, { some: 'data' });
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(201);
                })
                .then(function () {
                    return test.collectionJson(collectionUrl);
                })
                .then(function (result) {
                    expect(result.response.statusCode).toBe(200); 
                    expect(result.data.length).toBe(1);
                    expect(result.data[0].some).toBe('data'); 
                    done();
                })
                .catch(function (err) {
                    done(err);
                })
                .done(function() {
                    test.stopServer();    
                });
        });
    });

});