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

var fs = require('fs');
var mongodb_rest = require('./lib/mongodb_rest');

fs.readFile('./settings.json', function(err, data) {
    var settings, custom_settings;
    if (err) {
        sys.puts('No settings.json found. Using default settings');
        mongodb_rest.start(mongodb_rest.default_settings);
        process.exit(0);
    }
    try {
        custom_settings = JSON.parse(data);
    } catch (e) {
        sys.puts('Error parsing settings.json');
        process.exit(1);
    }
    settings = custom_settings || mongodb_rest.default_settings;
    mongodb_rest.start(settings);
});