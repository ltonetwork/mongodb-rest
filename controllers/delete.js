var deleteCommand = require("../commands/delete");
var sys = require("sys");

exports.register = function(app){
	app.del('/:db/:collection/:id?', function(req, res, next) {
        // JSON decode query or spec
		var spec = req.query.query? JSON.parse(req.query.query) : {};
            spec = req.query.spec? JSON.parse(req.query.spec) : spec;
        
        var options = req.query.options? JSON.parse(req.query.options) : {};
        
        deleteCommand(
            {
                connection: app.set("dbconnection"),
                db: req.params.db,
                collection: req.params.collection
            },
            spec,
            options,
            function(err, docs) {
                app.renderResponse(res, err, docs);
            });
	});
};
