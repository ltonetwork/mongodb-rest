var createCommand = require("../commands/create");
var sys = require("sys");

exports.register = function(app) {
	app.post('/:db/:collection', function(req, res, next) {
		if (req.body) {
			
            createCommand( 
                {
                    connection: app.set("dbconnection"),
                    db: req.params.db,
                    collection: req.params.collection
                },
                req.body,
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
