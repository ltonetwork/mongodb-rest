var mongo = require("mongodb");
var ObjectID = require("mongodb/lib/mongodb/bson/bson").ObjectID;
var dereference = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");
var sys = require("sys");

exports.register = function(app) {
	
	app.get('/:db/:collection/:id?', function(req, res, next) {
		
		if(req.params.db != app.set('options').db.name) {
			next();
			return;
		}
		
		var query = req.query.query? JSON.parse(req.query.query) : {};
		var options = req.query.options?JSON.parse(req.query.options) : {};

		jsonUtils.deepDecode(query);

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

		dbconnection.open(req.params.db, app.set('options'), function(err,db) {
			db.collection(req.params.collection, function(err, collection) {

				if(req.params.id) {
	    		
					// if there is requested object by ID -> query only One document
					collection.findOne(query, options, function(err, doc){
						if(doc == null)
							err = new Error("not found");
						
						if(req.query.deep == "true") {
							dereference(db, doc, function(err) {
								app.renderResponse(res, err, doc);
							});
						} else
							app.renderResponse(res, err, doc);
		              
						db.close();
					});
				} else {
					// otherwise find all matching given query
					collection.find(query, options, function(err, cursor) {
						cursor.toArray(function(err, docs){
							
							if((req.query.countHits?req.query.countHits:false) == true) {
								collection.count(query, function(err, allCount) {
									app.renderResponse(res, err, docs, allCount);
								});
							} else
								app.renderResponse(res, err, docs);
			            
							db.close();
						});
					});
				}
			});
		});
	});
};