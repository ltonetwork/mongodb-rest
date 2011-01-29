/* 
    server.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 
var fs = require("fs");
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

try {
	  config = JSON.parse(fs.readFileSync(argv.config));
} catch(e) {
  throw new Error("could not read config "+argv.config+" internal error: "+e.toString());
}

require("mongodb-rest/embeded").listen(config);