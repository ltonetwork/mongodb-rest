var mongo = require("mongodb");
var ObjectID = require("mongodb/external-libs/bson").ObjectID;
var dereference = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");
var sys = require("sys");

/*
    target = { connection: { host, port }, db, collection } || { connection: [ {host, port} ], db, collection }
    spec = { _id } || { field:value }
    data = { field:value }
    options = { safe: true, upsert: true, multi: true, set: true }
    next = function( err, mongoDbResult )
*/
module.exports = function(target, spec, data, options, next) {
	var options = options?options:{};
    if(!options.safe)
        options.safe = true;
    if(!options.upsert)
        options.upsert = true;
    if(!options.multi)
        options.multi = true;

	if(spec._id) {
        // covert _id to Mongo's ObjectID if given
        if(/^[0-9a-fA-F]{24}$/.test(spec._id)) {
	        spec['_id'] = new ObjectID(spec._id);
	    }
	    else
	        spec['_id'] = spec._id;

        // if _id is given do not multi update
        options.multi = false;
    }

    var updateData = {};
	for(var i in data)
		if(i != '_id'){ // protect _id

		    if(typeof data[i] == "object" && 
		       data[i] != null &&
		        typeof data[i]['namespace'] == "undefined" && 
                typeof data[i]['oid'] == "undefined") {

                // use the value as it is in case it is not _id or object reference
		    	updateData[i] = data[i];
                // decode the object
		        jsonUtils.deepDecode(updateData[i]);
		    }
		    else
                // decode the field (would procude fields with namespace & oid to DbReference
		    	updateData[i] = jsonUtils.decodeField(data[i]);
		}

    // open connection to DB (or DB Cluster if target.connection is array )
	dbconnection.open(target.db, target.connection, function(err,db) {
        if(err) { next(err); return; }

        // open collection
		db.collection(target.collection, function(err, collection) {
			if(err) { next(err); return; }

            // update collection
			collection.update(spec, options.set?{$set: updateData}:updateData, options, function(err, docs) {
                next(err, docs);
				db.close();
			});
		});
	});
}
