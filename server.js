/*
    server.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
        This file is part of mongodb-rest.
*/

var fs = require('fs'),
        util = require('util'),
        path = require('path'),
        express = require('express');

var config = { 'db': {
  'port': 27017,
  'host': 'localhost'
  },
  'server': {
    'port': 3000,
    'address': '0.0.0.0'
  },
  'flavor': 'regular',
  'debug': true
};

var express = require('express');
var app = module.exports.app = express();

try {
    if (process.argv[2] && fs.existsSync(process.argv[2])) {
        config = require(path.resolve(process.argv[2]));
    } else if (process.env.MONGODB_REST_CONFIG && fs.existsSync(process.env.MONGODB_REST_CONFIG)) {
        config = require(path.resolve(process.env.MONGODB_REST_CONFIG));
    } else {
        config = require(path.join(process.cwd(), 'config.json'));
    }
} catch(e) {
    console.log('Using default configuration. Use custom configuration as follows:');
    console.log('1. MONGODB_REST_CONFIG=/path/to/config.json mongodb-rest');
    console.log('2. mongodb-rest /path/to/config.json');
    console.log('3. create config.json in startup working directory.');
    console.log(' ');
    console.log('Default Configuration:');
    console.log(JSON.stringify(config, null, 2));
    console.log(' ');
}

module.exports.config = config;

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.static(process.cwd() + '/public'));
    app.use(express.logger());
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    if (config.accessControl){
        var accesscontrol = require('./lib/accesscontrol');
        app.use(accesscontrol.handle);
    }
});

require('./lib/main');
require('./lib/command');
require('./lib/rest');

app.listen(config.server.port, config.server.address);

console.log('mongodb-rest started: ' + config.server.address + ':' + config.server.port);
