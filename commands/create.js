var mongo = require("mongodb");
var ObjectID = require("mongodb/external-libs/bson").ObjectID;
var dereference = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");
var sys = require("sys");

/*
    target = { connection: { host, port }, db, collection } || { connection: [ {host, port} ], db, collection }
    data = {}
    next = function(err, mongoDbResult)
*/
module.exports = function(target, data, next) {
    // open DB connection
    dbconnection.open(target.db, target.connection, function(err, db) {
        if(err) { next(err); return; }
        // open collection
		db.collection(target.collection, function(err, collection) {
            // decode given data
			jsonUtils.deepDecode(data);
            // insert into the collection
			collection.insert(data, function(err, docs) {
                next(err, docs);
				db.close();
			});
		});
	});
}
