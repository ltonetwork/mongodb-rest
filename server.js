/* 
    server.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 

var fs = require("fs"),
		util = require('util'),
		express = require('express'),
        bodyParser = require('body-parser'),
        path = require('path');
		
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

app = express();

console.log('------------------------');
console.log('| Server is running... |');
console.log('------------------------\n');

try {
    config = JSON.parse(fs.readFileSync(path.join(process.cwd()+"/config.json")));
} catch(e) {
  // ignore
}

module.exports.config = config;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
app.use(express.static(path.join(process.cwd() + '/public')));
app.set('views', path.join(__dirname + '/views'));
app.set('view engine', 'jade');
	
if (config.accessControl){
	var accesscontrol = require('./lib/accesscontrol');
	app.use(accesscontrol.handle);
}	

require('./lib/main');
require('./lib/command');
require('./lib/rest');

if(!process.argv[2] || !process.argv[2].indexOf("expresso")) {
  app.listen(config.server.port, config.server.address);
}
