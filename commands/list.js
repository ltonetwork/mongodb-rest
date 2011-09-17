var mongo = require("mongodb");
var ObjectID = require("mongodb/external-libs/bson").ObjectID;
var dereference = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");
var sys = require("sys");

/*
    target = { connection: { host, port }, db, collection } || { connection: [ {host, port} ], db, collection }
    spec = {}
    options = { limit, skip, order, dereference: true, countQueryHits: true }
    next = function(err, docs || doc, hitsCount)
*/
module.exports = function(target, spec, options, next) {

    if(typeof options.countQueryHits == "undefined")
        options.countQueryHits = true;

    // deep decode spec
	jsonUtils.deepDecode(spec);

	// Providing an id overwrites giving a query in the URL
	if (spec._id) {
		if(/^[0-9a-fA-F]{24}$/.test(spec._id))
			spec._id = new ObjectID(spec._id);
		else
			spec._id = spec._id;
	}

	dbconnection.open(target.db, target.connection, function(err,db) {
		db.collection(target.collection, function(err, collection) {

			if(spec._id) { // dereference is currently supported only for single object
    		
				// if there is requested object by ID -> query only One document
				collection.findOne(spec, options, function(err, doc){
					if(doc == null)
						err = new Error("not found");

					if(options.dereference == "true") {
						dereference(db, doc, function(err) {
							next(err, doc);
						});
					} else
						next(err, doc);
	              
					db.close();
				});
			} else {

				// otherwise find all matching given query but without dereference support, 
                // however has countQueryHits instead
				collection.find(spec, options, function(err, cursor) {
					cursor.toArray(function(err, docs){
						
						if(options.countQueryHits) {
							collection.count(spec, function(err, allCount) {
								next(err, docs, allCount);
							});
						} else
							next(err, docs);
		            
						db.close();
					});
				});
			}
		});
	});
}
