var fs = require("fs"),
		sys = require("sys"),
		express = require('express');

exports.listen = function(config,requestAuthHandler) {
	var app = module.exports.app = express.createServer();

	app.configure(function(){
	    app.use(express.bodyDecoder());
	    app.use(express.cookieDecoder());
	    app.use(express.staticProvider(__dirname + '/../public'));
	    app.use(express.logger());
	    app.set('views', __dirname + '/../views');
	    app.set('view engine', 'jade');
	});
	
	module.exports.config = config;
	module.exports.requestAuthHandler = requestAuthHandler;
	
	require('./main');
	require('./command');
	require('./rest');
	
	if(!process.argv[2] || process.argv[2].indexOf("expresso") == -1) {
	  app.listen(config.server.port, config.server.address, function(){
		  sys.log("mongodb-rest listening at "+config.server.address+":"+config.server.port);
	  });
	}
}
