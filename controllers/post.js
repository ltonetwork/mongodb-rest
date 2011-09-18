var createCommand = require("../commands/create");
var sys = require("sys");

exports.register = function(app) {
	app.post('/:db/:collection', function(req, res, next) {
        var options = {};
        if(app.set("augmentObject"))
            options.augment = app.set("augmentObject")('create');

		if (req.body) {
            createCommand( 
                {
                    connection: app.set("dbconnection"),
                    db: req.params.db,
                    collection: req.params.collection
                },
                req.body,
                options,
                function(err, docs) {
                    if(err != null)
					    app.renderResponse(res, err, docs);
				    else
					    if(Array.isArray(req.body))
						    app.renderResponse(res, err, docs);
					    else
						    app.renderResponse(res, err, docs[0]);
                });
		} else {
			app.renderResponse(res, new Error("body required"));
		}
	});
};
