var mongo = require("mongodb");
var ObjectID = require("mongodb/external-libs/bson").ObjectID;
var dereference = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");
var sys = require("sys");

exports.register = function(app) {
	app.del('/%/:db', function(req, res, next) {
		dbconnection.open(req.params.db, app.set('options'), function(err, db) {
			db.dropDatabase(function(err) {
                app.renderResponse(res, err, true);
				db.close();
            });
		});
	});
};
