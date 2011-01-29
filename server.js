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

var argv = require('optimist')
           .default("config", process.cwd()+"/config.json")
           .argv;
		
var config = { "db": {
  'port': 27017,
  'host': "localhost"
  },
  'server': {
    'port': 3000,
    'address': "0.0.0.0"
  },
  'flavor': "regular",
  'debug': true
};

var app = module.exports.app = express.createServer();

app.configure(function(){
    app.use(express.bodyDecoder());
    app.use(express.staticProvider(__dirname + '/public'));
    app.use(express.logger());
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
});

try {
  config = JSON.parse(fs.readFileSync(argv.config));
} catch(e) {
  throw new Error("could not read config "+process.cwd()+argv.config+" internal error: "+e.toString());
}

module.exports.config = config;

require('./lib/main');
require('./lib/command');
require('./lib/rest');

if(!process.argv[2] || process.argv[2].indexOf("expresso") == -1) {
  app.listen(config.server.port, config.server.address);
}
