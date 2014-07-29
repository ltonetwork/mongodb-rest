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
		
var defaultConfig = { 
  "db": {
    'port': 27017,
    'host': "localhost"
    },
  'server': {
    'port': 3000,
    'address': "0.0.0.0"
  },
  "accessControl": {
    "allowOrigin": "*",
    "allowMethods": "GET,POST,PUT,DELETE,HEAD,OPTIONS"
  },  
  'flavor': "regular",
  'debug': true
};

var server;

module.exports = {

  //
  // Start the REST API server.
  //
  startServer: function (config) {
    if (!config) {
      config = defaultConfig;
    }

    var app = express();

    app.use(require('body-parser')());

    if (config.accessControl) {
      var accesscontrol = require('./lib/accesscontrol');
      app.use(accesscontrol.handle);
    } 

    require('./lib/rest')(app, config);

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

    var config = defaultConfig;

    // Load configuration from file.
    try {
      var configFilePath = process.cwd()+"/config.json";
      config = JSON.parse(fs.readFileSync(configFilePath));
      console.log("Loaded configuration from: " + configFilePath);
    } catch(e) {
      // ignore
    }

    //
    // Auto start server when run as 'node server.js'
    //
    module.exports.startServer(config);
  }
}