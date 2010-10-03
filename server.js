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
    app.use(express.staticProvider(__dirname + '/lib/public'));
    app.use(express.logger());
    app.set('views', __dirname + '/lib/views');
    app.set('view engine', 'jade');
});

try {
  config = JSON.parse(fs.readFileSync("./config.json"));
} catch(e) {
  // ignore
}

module.exports.config = config;

require('./lib/main');
require('./lib/command');
require('./lib/rest');

if(process.argv[0] != "expresso") {
  app.listen(config.server.port, config.server.address);
}
