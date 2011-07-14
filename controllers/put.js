var mongo = require("mongodb");
var ObjectID = require("mongodb/lib/mongodb/bson/bson").ObjectID;
var dereference = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");
var sys = require("sys");

exports.register = function(app){
	app.put('/:db/:collection/:id?', function(req, res, next) {
		
		if(req.params.db != app.set('options').db.name) {
			next();
			return;
		}
		
		var spec = {};
		var data = {};
		var options = {safe: true, upsert: true, multi: false};

		if(req.params.id) {
	        if(/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
		        spec['_id'] = new ObjectID(req.params.id);
		    }
		    else
		        spec['_id'] = req.params.id;
	    } else {
	        for(var i in req.body.spec)
	            if(i.indexOf("$id") != -1 && /^[0-9a-fA-F]{24}$/.test(req.body.spec[i])) 
	                spec[i] = new ObjectID(req.body.spec[i]);
	            else
	                spec[i] = req.body.spec[i];
	    }

	    var setData = {$set: {}};
		for(var i in req.body)
			if(i != '_id'){ // protect _id
			    if(typeof req.body[i] == "object" && 
			        req.body[i] != null &&
			        typeof req.body[i]['namespace'] == "undefined" && 
	                typeof req.body[i]['oid'] == "undefined") {
	                
			    	setData.$set[i] = req.body[i];
			        jsonUtils.deepDecode(setData.$set[i]);
			    }
			    else
			    	setData.$set[i] = jsonUtils.decodeField(req.body[i]);
			}
  
		if(!req.params.id)
			options['multi'] = true;

		dbconnection.open(req.params.db, app.set('options'), function(err,db) {
			db.collection(req.params.collection, function(err, collection) {
				
				collection.update(spec, setData, options, function(err, docs) {
					
					if(err != null)
						app.renderResponse(res, err);
					else
					if(req.params.id && docs && docs.length == 1)
						app.renderResponse(res, err, docs[0]);
					else
					if(docs.length != 0)
						app.renderResponse(res, err, docs);
					else
						app.renderResponse(res, new Error('could not update'));
					db.close();
				});
			});
		});
	});
};

