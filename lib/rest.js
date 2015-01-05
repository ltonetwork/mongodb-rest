/* 
    rest.js
    mongodb-rest

    Maintained by Ashley Davis 2014-07-02
    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var auth = require('./auth');
var BSON = mongodb.BSONPure;

module.exports = function (app, config) {

    if (config.auth) {
        // Hook our auth setup into the app
        auth(app, config);
    }

    var extend = require("extend");

    var urlPrefix = config.urlPrefix || "";
    var logger = config.logger;

    if (!logger) {
        throw new Error("Config should contain a logger!");
    }

    var collectionOutputType = config.collectionOutputType || "json";

    //
    // Transform collection for json output.
    //
    var defaultJsonTransform =  function (input) {
        // By default, don't transform json data.
        return input;
    };

    //
    // Transform collection for csv output.
    //
    var defaultCsvTransform = function (input) {
        if (input.length == 0) {
            // Nothing!
            return [];
        }

        // Convert to headers and rows for csv.
        var keys = Object.keys(input[0]);
        return [keys].concat(
            input.map(function (dataItem) {
                return keys.map(function (key) {
                    return dataItem[key];
                });
            })
        );
    };

    //
    // Transform a collection for output.
    //
    var transformCollection = function (outputType, input) {

        var transform = config.transformCollection;
        if (!transform) {
            if (outputType === 'json') {
                transform = defaultJsonTransform;
            }
            else if (outputType === 'csv') {
                // Convert input array of objects into an array of rows/columns for csv output.
                transform = defaultCsvTransform
            }
            else {
                throw new Error('Unknown output transform type: ' + outputType + '\\n' +
                                'Valid types are "json" and "csv"');
            }
        }

        return transform(input);
    };

    var dbConnectionStr;
    if (typeof config.db === 'string') {
        dbConnectionStr = config.db;
    } 
    else if (config.db) {
        // Old style configuration, for backward compatibility.
        dbConnectionStr = 'mongodb://';

        if (config.db.username && config.db.password) {
            dbConnectionStr += config.db.username + ':' + config.db.password + '@';
        }

        dbConnectionStr += config.db.host;

        if (config.db.port) {
            dbConnectionStr += ':' + config.db.port;
        }
    }
    else {
        throw new Error('config.db is not defined!');
    }

    //
    // Parameters for connection to the server.
    // http://mongodb.github.io/node-mongodb-native/api-generated/server.html
    //
    var defaultServerParams = {
        auto_reconnect: true,
    };
    
    var serverParams = defaultServerParams;
    if (config.mongoOptions && config.mongoOptions.serverOptions) {
        serverParams = extend(false, defaultServerParams, config.mongoOptions.serverOptions);
    }

    logger.verbose("Database server options: ");
    logger.verbose(serverParams);

    //
    // Parameters for connection to the database.
    // http://mongodb.github.io/node-mongodb-native/api-generated/db.html
    //
    var defaultDbParams = {
        w: 1, // Default write concern.
    };

    var dbParams = defaultDbParams;
    if (config.mongoOptions && config.mongoOptions.dbOptions) {
        dbParams = config.mongoOptions.dbOptions;
    }

    logger.verbose("Database options: ");
    logger.verbose(dbParams);

    //
    // Get database names.
    //
    app.get(urlPrefix + '/dbs', function(req, res) {

        MongoClient.connect(dbConnectionStr, function (err, db) {

            if (err) {
                logger.error('Db open error: ' + err.message);
                res.status(500).json({ message: 'Server error' });
                return;
            }

            // Use the admin database for the operation
            var adminDb = db.admin();

            // List all the available databases
            adminDb.listDatabases(function(err, dbs) {
                if (err) {
                    db.close();
                    logger.error('Error listing database: ' + err.message);
                    res.status(500).json({ message: 'Server error' });
                    return;
                }

                var dbNames = dbs.databases.map(function (db) {
                    return db.name;
                });

                res.json(dbNames);
                db.close();
            });
        });
    });

    //
    // Get names of all collections in specified database.
    //
    app.get(urlPrefix + '/:db', function (req, res) {

        MongoClient.connect(dbConnectionStr + '/' + req.params.db, function (err, db) {

            if (err) {
                logger.error('Db open error: ' + err.message);
                res.status(500).json({ message: 'Server error' });
                return;
            }

            db.collectionNames(function (err, collections) {
                if (err) {
                    db.close();
                    logger.error('Error getting collection names: ' + err.message);
                    res.status(500).json({ message: 'Server error' });
                    return;
                }

                var collectionNames = collections.map(function (collection) { 
                    // Pull out the name of the collection and chop off the database name.
                    return collection.name.substring(req.params.db.length+1); 
                });

                res.json(collectionNames);
                db.close();
            });
        });
    });

    /**
    * Query
    */
    app.get(urlPrefix + '/:db/:collection/:id?', function(req, res) { 
        var query = req.query.query ? JSON.parse(req.query.query) : {};

        // Providing an id overwrites giving a query in the URL
        if (req.params.id) {
            query = {'_id': new BSON.ObjectID(req.params.id)};
        }
        var options = req.params.options || {};

        var test = ['limit','sort','fields','skip','hint','explain','snapshot','timeout'];

        for( o in req.query ) {
            if( test.indexOf(o) >= 0 ) {
                options[o] = req.query[o];
            } 
        }

        MongoClient.connect(dbConnectionStr + '/' + req.params.db, function (err, db) {

            if (err) {
                logger.error('Db open error: ' + err.message);
                res.status(500).json({ message: 'Server error' });
                return;
            }

            db.collection(req.params.collection, function(err, collection) {
                if (err) {
                    db.close();
                    logger.error('Error getting collection ' + collection + ': ' + err.message);
                    res.status(500).json({ message: 'Server error' });
                    return;
                }

                collection.find(query, options, function(err, cursor) {
                    if (err) {
                        db.close();
                        logger.error('Error finding document(s): ' + err.message);
                        res.status(500).json({ message: 'Server error' });
                        return;
                    }

                    cursor.toArray(function(err, docs){
                        if (err) {
                            db.close();
                            logger.error('Error getting database cursor as array: ' + err.message);
                            res.status(500).json({ message: 'Server error' });
                            return;
                        } 

                        var result = [];          
                        if(req.params.id) {
                            if(docs.length > 0) {
                                result = docs[0];
                                res.json(result);
                            } else {
                                res.status(404).json({ ok: 0 });
                            }
                        } else {
                            docs.forEach(function(doc) {
                                result.push(doc);
                            });

                            var outputType = req.query.output || collectionOutputType;
                            result = transformCollection(outputType, result)
                            res[outputType](result);
                        }
                    
                        db.close();
                    });
                });
            });

        });
    });

    /**
    * Insert
    */
    app.post(urlPrefix + '/:db/:collection', function(req, res) {
        if(req.body) {
            MongoClient.connect(dbConnectionStr + '/' + req.params.db, function (err, db) {

                if (err) {
                    logger.error('Db open error: ' + err.message);
                    res.status(500).json({ message: 'Server error' });
                    return;
                }

                db.collection(req.params.collection, function(err, collection) {
                    if (err) {
                        db.close();
                        logger.error('Error getting collection ' + collection + ': ' + err.message);
                        res.status(500).json({ message: 'Server error' });
                        return;
                    }

                    // We only support inserting one document at a time
                    collection.insert(
                        Array.isArray(req.body) ? req.body[0] : req.body, 
                        function(err, docs) {
                            if (err) {
                                db.close();
                                logger.error('Error inserting into collection ' + collection + ': ' + err.message);
                                res.status(500).json({ message: 'Server error' });
                                return;
                            }

                            res.header('Location', '/'+req.params.db+'/'+req.params.collection+'/'+docs[0]._id.toHexString());
                            res.status(201).json({ ok: 1 });
                            db.close();
                        }
                    );
                });
            });
        } else {
            res.json({ ok: 1 });
        }
    });

    /**
    * Update
    */
    app.put(urlPrefix + '/:db/:collection/:id', function(req, res) {
        var spec = {'_id': new BSON.ObjectID(req.params.id)};

        MongoClient.connect(dbConnectionStr + '/' + req.params.db, function (err, db) {

            if (err) {
                logger.error('Db open error: ' + err.message);
                res.status(500).json({ message: 'Server error' });
                return;
            }

            db.collection(req.params.collection, function(err, collection) {
                if (err) {
                    db.close();
                    logger.error('Error getting collection ' + collection + ': ' + err.message);
                    res.status(500).json({ message: 'Server error' });
                    return;
                }

                collection.update(spec, req.body, true, function(err, docs) {
                    res.json({ ok: 1 });
                    db.close();
                });
            });
        });
    });

    /**
    * Delete
    */
    app.delete(urlPrefix + '/:db/:collection/:id', function(req, res) {
        var spec = {'_id': new BSON.ObjectID(req.params.id)};

        MongoClient.connect(dbConnectionStr + '/' + req.params.db, function (err, db) {

            if (err) {
                logger.error('Db open error: ' + err.message);
                res.status(500).json({ message: 'Server error' });
                return;
            }

            db.collection(req.params.collection, function(err, collection) {
                if (err) {
                    logger.error('Error getting collection ' + collection + ': ' + err.message);
                    res.status(500).json({ message: 'Server error' });
                    return;
                }

                collection.remove(spec, function(err, docs) {
                    if (err) {
                        logger.error('Error removing from ' + collection + ': ' + err.message);
                        res.status(500).json({ message: 'Server error' });
                        return;
                    }

                    res.json({ ok: 1 });
                    db.close();
                });
            });
        });
    });
};