/* 
    server.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 

var fs = require("fs");
var path = require("path");
var util = require('util');
var express = require('express');
		
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
  'debug': true,
  'humanReadableOutput': true
};

var server;

module.exports = {

  //
  // Start the REST API server.
  //
  startServer: function (config) {
    if (!config) {
      var configFilePath = path.join(process.cwd(), "config.json");
      if (fs.existsSync(configFilePath)) {
        console.log("Loading configuration from: " + configFilePath);
        config = JSON.parse(fs.readFileSync(configFilePath));        
      }
      else {
        console.log("Using default configuration.");
      }
    }

    var app = express();

    app.use(require('body-parser')());

    if (config.humanReadableOutput) {
      app.set('json spaces', 4);
    }

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

    //
    // Auto start server when run as 'node server.js'
    //
    module.exports.startServer();
  }
}