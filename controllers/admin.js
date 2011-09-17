var mongo = require("mongodb");
var ObjectID = require("mongodb/external-libs/bson").ObjectID;
var dbconnection = require("../commands/helpers/dbconnection");
var sys = require("sys");

exports.register = function(app) {
	app.del('/%/:db', function(req, res, next) {
		dbconnection.open(req.params.db, app.set('dbconnection'), function(err, db) {
			db.dropDatabase(function(err) {
                app.renderResponse(res, err, true);
				db.close();
            });
		});
	});
};
