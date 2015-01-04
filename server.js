/* 
    server.js
    mongodb-rest

    Maintained by Ashley Davis 2014-07-02
    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 

var fs = require("fs");
var path = require("path");
var express = require('express');
var extend = require("extend");

//
// Default logger to use, if none is passed in.
//
var defaultLogger = {
  verbose: function (msg) {
//    console.log(msg);
  },

  info: function (msg) {
    console.log(msg);
  },

  warn: function (msg) {
    console.log(msg);
  },

  error: function (msg) {
    console.log(msg);
  },
};
		
var defaultConfig = { 
    db: 'mongodb://localhost:27017',
    server: {
        port: 3000,
        address: "0.0.0.0"
    },
    accessControl: {
        allowOrigin: "*",
        allowMethods: "GET,POST,PUT,DELETE,HEAD,OPTIONS",
        allowCredentials: false
    },  
    mongoOptions: {
        serverOptions: {
        },
        dbOptions: {
            w: 1
        }
    },
    humanReadableOutput: true,
    collectionOutputType: "json",
    urlPrefix: "",
    logger: defaultLogger,
};

var server;

module.exports = {

  //
  // Start the REST API server.
  //
  startServer: function (config, started) {

    var logger = (config && config.logger) || defaultLogger;
    var curDir = process.cwd();

    logger.verbose("Current directory: " + curDir);

    if (!config) {
      var configFilePath = path.join(curDir, "config.json");
      if (fs.existsSync(configFilePath)) {
        logger.verbose("Loading configuration from: " + configFilePath);
        config = JSON.parse(fs.readFileSync(configFilePath));        
        config.logger = defaultLogger;
      }
      else {
        logger.verbose("Using default configuration.");
        logger.verbose("Please put config.json in current directory to customize configuration.");
        config = defaultConfig;
      }
    }
    else {
      if (!config.logger) {
        config.logger = defaultLogger;
      }
    }

    var app = express();
    require('express-csv');

    app.use(require('body-parser')());

    if (config.humanReadableOutput) {
      app.set('json spaces', 4);
    }

    if (config.accessControl) {
      var accesscontrol = require('./lib/accesscontrol')(config);
      app.use(accesscontrol.handle);
    } 

    app.get('/favicon.ico', function (req, res) {
      res.status(404);
    });

    if (!config.db) {
      config.db = "mongodb://localhost:27017";
    }

    require('./lib/rest')(app, config);

    logger.verbose('Input Configuration:');
    logger.verbose(config);  

    // Make a copy of the config so that defaults can be applied.
    config = extend(true, {}, config);
    if (!config.server) {
      config.server = {};
    }

    if (!config.server.address) {
      config.server.address = "0.0.0.0";
    }
    
    if (!config.server.port) {
      config.server.port = 3000;
    }

    logger.verbose('Configuration with defaults applied:');
    logger.verbose(config);  

    var host = config.server.address;
    var port = config.server.port;

    logger.verbose('Starting mongodb-rest server: ' + host + ":" + port); 
    logger.verbose('Connecting to db ' + JSON.stringify(config.db, null, 4));

    server = app.listen(port, host, function () {
      logger.verbose('Now listening on: ' + host + ":" + port); 

      if (started) {
        started();
      }
    });
  },

  //
  // Stop the REST API server.
  //
  stopServer: function () {
    if (server) {
      server.close();
      server = null;
    }
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