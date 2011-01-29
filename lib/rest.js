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
    util = require("./util");

/**
 * Query
 */
app.get('/:db/:collection/:id?', function(req, res) { 
  var query = req.query.query? JSON.parse(req.query.query) : {};
  var options = req.query.options?JSON.parse(req.query.options) : {};

  // Providing an id overwrites giving a query in the URL
  if (req.params.id) {
    query = {'_id': new mongo.ObjectID(req.params.id)};
    options.limit = 1; // autolimit to one object only
  }
  
  // Providing an limit / skip overwrites giving a query in the URL
  if(req.query.limit)
      options.limit = req.query.limit;
  if(req.query.skip)
      options.skip = req.query.skip;
      
  var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true}));
  db.open(function(err,db) {
    db.collection(req.params.collection, function(err, collection) {
      collection.find(query, options, function(err, cursor) {
        cursor.toArray(function(err, docs){
          if(req.params.id) {

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
app.post('/:db/:collection', function(req, res) {
  if(req.body) {
    var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true}));
    db.open(function(err, db) {
      db.collection(req.params.collection, function(err, collection) {
    	
		  var data = {};
		  if(config.requestHandler)
			  require(config.requestHandler).post(req, res, data);
		  else
			  data = req.body;

		  collection.insert(JSON.stringify(data), function(err, docs) {
	        
	         // check if there is defined responseRender, useful to augment the result
	         if(config.responseRender) { 
	             require(config.responseRender).post(req, res, err, docs);
	         } else { 
	         // otherwise default to raw json output
	             if(!Array.isArray(data)) {
	                res.header('Location', '/'+req.params.db+'/'+req.params.collection+'/'+docs[0]._id.toHexString());
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
app.put('/:db/:collection/:id', function(req, res) {
  var spec = {};
  var data = {};
  
  if(config.requestHandler)
	  require(config.requestHandler).put(req,res,spec,data);
  else {
	  spec = {'_id': new mongo.ObjectID(req.params.id)};
	  data = req.body;
  }
  
  var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true}));
  db.open(function(err, db) {
    db.collection(req.params.collection, function(err, collection) {
      collection.update(spec, data, {safe: true, upsert: true}, function(err, docs) {
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
app.del('/:db/:collection/:id', function(req, res) {
  var spec = {};
  
  if(config.requestHandler) {
	  require(config.requestHandler).del(req,res,spce);
  } else {
	  spec = {'_id': new mongo.ObjectID(req.params.id)};
  }

  var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true}));
  db.open(function(err, db) {
    db.collection(req.params.collection, function(err, collection) {
      collection.remove(spec, function(err, docs) {
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
