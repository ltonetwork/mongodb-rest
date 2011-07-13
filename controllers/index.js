exports.register = function(app) {
	app.get('/', function(req, res){
	  if(app.set("options").mode == "development") {
	    res.render('index', {
	      locals: {
	        config: app.set("options")
	      }
	    });
	  } else {
	    res.send();
	  }
	});
};