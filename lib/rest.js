/*
    rest.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/
var mongo = require("mongodb"),
    app = module.parent.exports.app,
    config = module.parent.exports.config,
    requestAuthHandler = module.parent.exports.requestAuthHandler,
    util = require("./util"),
    dereference = require("./dereference");

var ObjectID = require("mongodb/lib/mongodb/bson/bson").ObjectID;

var sys = require("sys");

var dbconnection = require("./extjs/dbconnection");

/**
 * Query
 */
app.get('/:db/:collection/:id?', requestAuthHandler, function(req, res) {
  var query = req.query.query? JSON.parse(req.query.query) : {};
  var options = req.query.options?JSON.parse(req.query.options) : {};

  if(config.requestHandler)
	  require(config.requestHandler).query(req,res,query,options);

  // Providing an id overwrites giving a query in the URL
  if (req.params.id) {
    if(/^[0-9a-fA-F]{24}$/.test(req.params.id))
        query = {'_id': new ObjectID(req.params.id)};
    else
        query = {'_id': req.params.id};
        
    options.limit = 1; // autolimit to one object only
  }

  // Providing an limit / skip overwrites giving a query in the URL
  if(req.query.limit)
      options.limit = req.query.limit;
  if(req.query.skip)
      options.skip = req.query.skip;

  dbconnection.open(req.params.db, config, function(err,db) {
    db.collection(req.params.collection, function(err, collection) {
      collection.find(query, options, function(err, cursor) {
        cursor.toArray(function(err, docs){
          if(req.params.id) {
              var renderResult = function(err, docs) {
                  // check if there is defined responseRender, useful to augment the result
                  if(config.responseRender) {
                    require(config.responseRender).query(req, res, err, docs);
                  } else {
                	// otherwise default to raw json output
                	  if(docs.length > 0) {
                        var result = util.flavorize(docs[0], "out");
                        res.header('Content-Type', 'application/json');
                        res.send(result);
                	  } else {
                          res.send("strange",404);
                      }
                  }
              }
              if(req.query.deep == "true") {
                  dereference(db, docs, function(err) {
                      renderResult(err, docs);
                  });
              }
              else
                  renderResult(err, docs);

          } else {

            var sendResponse = function(docs, allCount) {
            
                // check if there is defined responseRender, useful to augment the result
                if(config.responseRender) {
                   require(config.responseRender).query(req, res, err, docs, allCount);
                } else {
                // otherwise default to raw json output
                    var result = [];
                    docs.forEach(function(doc){
                        result.push(util.flavorize(doc, "out"));
                    });

                    res.header('Content-Type', 'application/json');
                    res.send(result);
                }
            };

            if(config.alwaysCountQueryHits == true || (req.query.countHits?req.query.countHits:false) == true) {
                collection.count(query, function(err, allCount) {
                    sendResponse(docs, allCount);
                });
            } else {
                sendResponse(docs);
            }

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
app.post('/:db/:collection', requestAuthHandler, function(req, res) {
  if(req.body) {
    dbconnection.open(req.params.db, config, function(err,db) {
      db.collection(req.params.collection, function(err, collection) {

		  if(config.requestHandler)
			  require(config.requestHandler).post(req, res);
            
		  collection.insert(req.body, function(err, docs) {

	         // check if there is defined responseRender, useful to augment the result
	         if(config.responseRender) {
	             require(config.responseRender).post(req, res, err, docs);
	         } else {
	         // otherwise default to raw json output
	             if(!Array.isArray(data)) {
	                res.header('Location', '/'+req.params.db+'/'+req.params.collection+'/'+data._id.toHexString());
	                res.header('Content-Type', 'application/json');
	                res.send('{"ok":1}', 201);
	                db.close();
	             } else {
	                // XXX return several Location headers?
	                res.header('Content-Type', 'application/json');
	                res.send('{"ok":'+docs.length+'}', 201);
	                db.close();
	             }
	         }

	      });
      });
    });
  } else {
    res.header('Content-Type', 'application/json');
    res.send('{"ok":0}',200);
  }
});

/**
 * Update
 */
app.put('/:db/:collection/:id?', requestAuthHandler, function(req, res) {
  var spec = {};
  var data = {};
  var options = {safe: true, upsert: true, multi: false};

  if(config.requestHandler)
	  require(config.requestHandler).put(req,res,spec,data);
  else {
      if(req.params.id)
    	  spec = {'_id': new mongo.ObjectID(req.params.id)};
	  data = req.body;
  }
  
  if(!req.params.id)
     options['multi'] = true;

  dbconnection.open(req.params.db, config, function(err,db) {
    db.collection(req.params.collection, function(err, collection) {
    
      collection.update(spec, data, options, function(err, docs) {
        // check if there is defined responseRender, useful to augment the result
        if(config.responseRender) {
            require(config.responseRender).put(req, res, err, docs);
        } else {
        // otherwise default to raw json output
            res.header('Content-Type', 'application/json');
            res.send('{"ok":1}');
            db.close();
        }
      });
    });
  });
});

/**
 * Delete
 */
app.del('/:db/:collection/:id', requestAuthHandler, function(req, res) {
  var spec = {};

  if(config.requestHandler) {
	  require(config.requestHandler).del(req,res,spec);
  } else {
	  spec = {'_id': new mongo.ObjectID(req.params.id)};
  }

  //sys.log("SHOULD DELETE "+req.url);

  dbconnection.open(req.params.db, config, function(err,db) {
    db.collection(req.params.collection, function(err, collection) {
      if(err != null)
            sys.log("DELETE:"+req.params.collection+" -> error: "+sys.inspect(err.stack));
      
      collection.remove(spec, {safe: true}, function(err, docs) {
      // check if there is defined responseRender, useful to augment the result
        if(config.responseRender) {
            require(config.responseRender).del(req, res, err, docs);
        } else {
        // otherwise default to raw json output
            res.header('Content-Type', 'application/json');
            res.send('{"ok":1}');
            db.close();
        }
      });
    });
  });
});

