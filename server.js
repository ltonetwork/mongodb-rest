/* 
    server.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 

var fs = require("fs"),
		util = require('util'),
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

var app = express();

try {
  config = JSON.parse(fs.readFileSync(process.cwd()+"/config.json"));
} catch(e) {
  // ignore
}

app.use(require('body-parser')());
app.use(express.static(process.cwd() + '/public'));

if (config.accessControl){
	var accesscontrol = require('./lib/accesscontrol');
	app.use(accesscontrol.handle);
}	

require('./lib/main')(app, config);
require('./lib/command')(app, config);
require('./lib/rest')(app, config);

var server;

module.exports = {

  //
  // Start the REST API server.
  //
  startServer: function () {
    console.log('Starting mongodb-rest server: ' + config.server.address + ":" + config.server.port); 
    server = app.listen(config.server.port, config.server.address);    
  },

  //
  // Stop the REST API server.
  //
  stopServer: function () {
    console.log("Stopping mongodb-rest server.");
    server.close();
  },

};

if (process.argv.length >= 2) {
  if (process.argv[1].indexOf('server.js') != -1) {
    //
    // Auto start server when run as 'node server.js'
    //
    module.exports.startServer();
  }
}