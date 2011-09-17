var listCommand = require("../commands/list");
var sys = require("sys");

exports.register = function(app) {
	app.get('/:db/:collection/:id?', function(req, res, next) {
        // JSON decode query or spec
		var spec = req.query.query? JSON.parse(req.query.query) : {};
            spec = req.query.spec? JSON.parse(req.query.spec) : spec;

        // JSON decode options
	    var options = req.query.options?JSON.parse(req.query.options) : {};
        if(app.set('options').alwaysCountQueryHits)
            options.countQueryHits = true;
        if(req.params.id)
            spec._id = req.params.id;
        if(req.params.limit)
            options.limit = parseInt(req.params.limit);
        if(req.params.skip)
            options.skip = parseInt(req.params.skip);
        if(req.params.deep)
            options.dereference = true;

        listCommand(
            {
                connection: app.set("dbconnection"),
                db: req.params.db,
                collection: req.params.collection
            },
            spec,
            options,
            function(err, docs, allCount) {
                app.renderResponse(res, err, docs, allCount);
            });
	});
};
