/* 
    server.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 

var fs = require("fs"),
		sys = require("sys"),
		express = require('express');

var config = module.exports.config = { "db": {
  'port': 27017,
  'host': "localhost"
  },
  'server': {
    'port': 3000,
    'address': "0.0.0.0"
  },
  'flavor': "regular",
  'debug': false
};

var app = module.exports.app = express.createServer();

app.configure(function(){
    app.use(express.bodyDecoder());
    app.use(express.staticProvider(__dirname + '/public'));
    app.use(express.logger());
});

require('./lib/main');
require('./lib/command');
require('./lib/rest');

fs.readFile("./config.json", 'utf8', function(err, data) {
    if (err) {
        sys.puts("No config.json found. Using default configuration");
    }
    try {
        config = JSON.parse(data);
    } catch (e) {
        sys.puts("Error parsing config.json");
        process.exit(1);
    }
    
    if(process.argv[0] == "node") {
      app.listen(config.server.port, config.server.address);
    }
    
});


