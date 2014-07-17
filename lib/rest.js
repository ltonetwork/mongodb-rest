/* 
    rest.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 
var mongo = require("mongodb");
var BSON = mongo.BSONPure;

module.exports = function (app, config) {

  var util = require("./util")(config);

  //
  // Parameters for connection to the server.
  // http://mongodb.github.io/node-mongodb-native/api-generated/server.html
  //
  var serverParams = {
    auto_reconnect: true,
  };

  //
  // Parameters for connection to the database.
  // http://mongodb.github.io/node-mongodb-native/api-generated/db.html
  //
  var dbParams = {
    w: 1, // Default write concern.
  }

  //
  // Get database names.
  //
  app.get('/dbs', function(req, res) { 

      var db = new mongo.Db('none', new mongo.Server(config.db.host, config.db.port, serverParams), dbParams);
      db.open(function(err,db) {
        if (err) {
          res.status(500).send(err.message);
          return;
        }

        // Use the admin database for the operation
        var adminDb = db.admin();

        // List all the available databases
        adminDb.listDatabases(function(err, dbs) {
            if (err) {
                res.status(500).send(err.message);
                return;
            }

            var dbNames = dbs.databases.map(function (db) {
                return db.name;
            });

            res.json(dbNames);
        });
      });
  });

  /**
   * Query
   */
  app.get('/:db/:collection/:id?', function(req, res) { 
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

    var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, serverParams), dbParams);
    db.open(function(err,db) {
      if (err) {
        res.status(500).send(err.message);
        return;
      }
      db.authenticate(config.db.username, config.db.password, function () {

        db.collection(req.params.collection, function(err, collection) {
          if (err) {
            res.status(500).send(err.message);
            return;
          }

          collection.find(query, options, function(err, cursor) {
            if (err) {
              res.status(500).send(err.message);
              return;
            }

            cursor.toArray(function(err, docs){
              if (err) {
                res.status(500).send(err.message);
                return;
              }

              var result = [];          
              if(req.params.id) {
                if(docs.length > 0) {
                  result = util.flavorize(docs[0], "out");
                  res.send(result);
                } else {
                  res.status(404).send({ ok: 0 });
                }
              } else {
                docs.forEach(function(doc){
                  result.push(util.flavorize(doc, "out"));
                });
                res.send(result);
              }
              db.close();
            });
          });
        });
      });
    });
  });

  /**
   * Insert
   */
  app.post('/:db/:collection', function(req, res) {
    if(req.body) {
      var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, serverParams), dbParams);
      db.open(function(err, db) {
        if (err) {
          res.status(500).send(err.message);
          return;
        }

        db.authenticate(config.db.username, config.db.password, function () {

          db.collection(req.params.collection, function(err, collection) {
            if (err) {
              res.status(500).send(err.message);
              return;
            }

            // We only support inserting one document at a time
            collection.insert(
              Array.isArray(req.body) ? req.body[0] : req.body, 
              function(err, docs) {
                if (err) {
                  res.status(500).send(err.message);
                  return;
                }

                res.header('Location', '/'+req.params.db+'/'+req.params.collection+'/'+docs[0]._id.toHexString());
                res.status(201).send({ ok: 1 });
                db.close();
              }
            );
          });
        });
      });
    } else {
      res.send({ ok: 1 });
    }
  });

  /**
   * Update
   */
  app.put('/:db/:collection/:id', function(req, res) {
    var spec = {'_id': new BSON.ObjectID(req.params.id)};

    var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, serverParams), dbParams);
    db.open(function(err, db) {
      if (err) {
        res.status(500).send(err.message);
        return;
      }

      db.authenticate(config.db.username, config.db.password, function () {

        db.collection(req.params.collection, function(err, collection) {
          if (err) {
            res.status(500).send(err.message);
            return;
          }

          collection.update(spec, req.body, true, function(err, docs) {
            res.send({ ok: 1 });
            db.close();
          });
        });
      });
    });
  });

  /**
   * Delete
   */
  app.delete('/:db/:collection/:id', function(req, res) {
    var spec = {'_id': new BSON.ObjectID(req.params.id)};
   
    var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, serverParams), dbParams);
    db.open(function(err, db) {
      if (err) {
        res.status(500).send(err.message);
        return;
      }

      db.authenticate(config.db.username, config.db.password, function () {

        db.collection(req.params.collection, function(err, collection) {
          if (err) {
            res.status(500).send(err.message);
            return;
          }

          collection.remove(spec, function(err, docs) {
            if (err) {
              res.status(500).send(err.message);
              return;
            }

            res.send({ ok: 1 });
            db.close();
          });
        });
      });
    });
  });

};