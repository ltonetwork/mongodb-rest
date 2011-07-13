var mongo = require("mongodb");
var ObjectID = require("mongodb/lib/mongodb/bson/bson").ObjectID;
var dereference = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");
var sys = require("sys");

exports.register = function(app){
	app.del('/:db/:collection/:id?', function(req, res) {
		
		if(req.params.db != app.set('options').db.name) {
			next();
			return;
		}
		
		var spec = {};
		if(req.params.id) {
			if(/^[0-9a-fA-F]{24}$/.test(req.params.id))
			    spec['_id'] = new ObjectID(req.params.id);
			else
			    spec['_id'] = req.params.id;
		}
		else {
			spec = req.query.query? JSON.parse(req.query.query) : {};
			jsonUtils.deepDecode(spec);
		}
	
		dbconnection.open(req.params.db, app.set('options'), function(err,db) {
			db.collection(req.params.collection, function(err, collection) {
				collection.remove(spec, {safe: true}, function(err, docs) {
					app.renderResponse(res, err, docs);
					db.close();
				});
			});
		});
	});
};