var mongo = require("mongodb");
var ObjectID = require("mongodb/lib/mongodb/bson/bson").ObjectID;
var dereference = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");

exports.register = function(app) {
	app.post('/:db/:collection', function(req, res, next) {
		if (req.body) {
			dbconnection.open(req.params.db, app.set('options'), function(err, db) {
				db.collection(req.params.collection, function(err, collection) {

					jsonUtils.deepDecode(req.body);

					collection.insert(req.body, function(err, docs) {
						if(err != null)
							app.renderResponse(res, err, docs);
						else
							if(Array.isArray(req.body))
								app.renderResponse(res, err, docs);
							else
								app.renderResponse(res, err, docs[0]);
						
						db.close();
					});
				});
			});
		} else {
			app.renderResponse(res, new Error("body required"));
		}
	});
};