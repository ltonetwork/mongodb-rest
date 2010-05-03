/* 
    server.js
    mongodb-rest

    Created by Tom de Grunt on 2010-05-02.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.

    mongodb-rest is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    mongodb-rest is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with mongodb-rest.  If not, see <http://www.gnu.org/licenses/>.
*/ 

var fs = require('fs'),
    MongoDbRest = require('./lib/mongodb_rest').MongoDbRest;

fs.readFile('./settings.json', function(err, data) {
    var settings;
    if (err) {
        sys.puts('No settings.json found. Using default settings');
        new MongoDbRest().start();
        process.exit(0);
    }
    try {
        settings = JSON.parse(data);
    } catch (e) {
        sys.puts('Error parsing settings.json');
        process.exit(1);
    }
    new MongoDbRest(settings).start();
});