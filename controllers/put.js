var updateCommand = require("../commands/update");
var sys = require("sys");

exports.register = function(app){
	app.put('/:db/:collection/:id?', function(req, res, next) {
        // JSON decode query or spec
		var spec = req.query.query? JSON.parse(req.query.query) : {};
            spec = req.query.spec? JSON.parse(req.query.spec) : spec;
        var options = req.query.options? JSON.parse(req.query.options) : {};

        if(req.params.id)
            spec._id = req.params.id;

        // check does the body contains $inc, & etc... specific mongodb update ops 
        // determines to use $set: {...} or not 
        if(JSON.stringify(req.body).indexOf("$") != -1) // TODO ugly way to check the entire body for $ char, improve
            options.set = false;
        else
            options.set = true;

        if(app.set("augmentObject"))
            options.augment = app.set("augmentObject")('update')

		updateCommand(
            {
                connection: app.set("dbconnection"),
                db: req.params.db, 
                collection: req.params.collection
            },
            spec,
            req.body,
            options,
            function(err, docs) {
                if(err != null)
					app.renderResponse(res, err);
				else
					app.renderResponse(res, err, docs);
            });
	});
};

