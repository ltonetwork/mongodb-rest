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

var sys = require("sys");
var mongo = require("./mongodb");
var http = require("http");
var url = require("url");
var fs = require('fs');

// mongo seems to return { "ok" : 1 } in certain cases
var MONGO_YES = JSON.stringify({"ok": 1})
var MONGO_NO  = JSON.stringify({"ok": 0})

var DEBUG = false;

var server;
var settings = exports.default_settings = { "db": {
	"port": 27017,
	"host": "localhost"
	},
	"server": {
		"port": 3000,
		"address": "0.0.0.0"
	},
	"flavor": "regular"
};

flavorizeDocument = function(doc, direction) {
	if (direction == "in") {
		if (settings['flavor'] == "sproutcore") {
			delete doc['guid']; // only do this in case flavor is set to sproutcore
		}
	} else {
		if (settings['flavor'] == "regular") {
			doc['_id'] = {'$oid': doc['_id'].toHexString()};
		} else {
			var guid = doc['_id'].toHexString();
			delete doc['_id'];
			doc['guid'] = guid;
		}
	}
	return doc;
}

parametersFromRequest = function (request) {
	var result = {};

	var u = url.parse(unescape(request.url),true);
	var p = u.pathname.slice(1).split("/", 3)

	result['db'] = p[0];
	result['collection'] = p[1];
	if (p.length == 3) {
		result['id'] = p[2];
	}
	result['options'] = {};
	
	switch (request.method) {
		case "GET":
			if( u.query != undefined ) {
				result['options'] = JSON.parse(u.query['query']);
			}	
			break;
		case "DELETE":
		case "PUT":
		case "POST":
			if(request.body!='') {
				result['options'] = JSON.parse(request.body);
			}
			break;
	}
	
	result['command'] = (u.hash == undefined ? "" : u.hash.slice(1));
	
	if (DEBUG == true) sys.puts("parameters: "+sys.inspect(result));
	
	return result;
}


// Return a set of 'readable' documents
returnDocuments = function (request, response, docs) {
	
	// Haven't found a better way - yet
	for (d in docs) {
		docs[d] = flavorizeDocument(docs[d], 'out');
	}
	
	response.body = JSON.stringify(docs);
	response.writeHead(200, { 'Content-Type': 'application/json; charset=utf8' });
  response.write(response.body, 'utf8');
  response.end();
}

doQuery = function (request, response, parameters) {
	if (parameters['id']!=undefined) {
		options = {"_id": mongo.ObjectID.createFromHexString(parameters['id'])};
	}
	var db = new mongo.Db(parameters['db'], server );
	db.open(function(err,db) {
		db.collection(parameters['collection'], function(err, collection) {
			collection.find(parameters['options'], function(err, cursor) {
				cursor.toArray(function(err, docs){
					returnDocuments(request, response, docs);
				});
			});
		});
	});
}

insertDocuments = function (request, response, parameters) {
	var db = new mongo.Db(parameters['db'], server );
	
	db.open(function(err,db) {
		db.collection(parameters['collection'], function(err, collection) {
			collection.insert(parameters['options'], function(err, docs) {
				response.writeHead(201, {'Location': "/"+parameters['db']+"/"+parameters['collection']+"/"+docs[0]['_id'].toHexString()});
				response.end(MONGO_YES);
			});
		});
	});
}

updateDocument = function (request, response, parameters) {
	var spec = {"_id": mongo.ObjectID.createFromHexString(parameters['id'])};
	var options = flavorizeDocument(parameters['options'],'in');
	
	var db = new mongo.Db(parameters['db'], server );
	db.open(function(err,db) {
		db.collection(parameters['collection'], function(err, collection) {
			collection.update(spec, options, true, function(err, docs) {
				response.writeHead( 200, {})
				response.end(MONGO_YES);
			});
		});
	});
}

deleteDocument = function (request, response, parameters) {
	var spec = {"_id": mongo.ObjectID.createFromHexString(parameters['id'])};
	var db = new mongo.Db(parameters['db'], server );
	db.open(function(err,db) {
		db.collection(parameters['collection'], function(err, collection) {
			collection.remove(spec, function(err, docs) {
				response.writeHead( 200, {})
				response.end(MONGO_YES);
			});
		});
	});
}

doCommand = function (request, response, parameters) {
	switch (parameters['command']) {
		/*
		 * Connects to the server, either using defaults or using provided options in body
		 */
		case "connect":
			server = new mongo.Server(parameters['options']['host'] || settings['db']['host'] || "localhost", parameters['options']['port'] || settings['db']['port'] || 27017, {})
		  response.writeHead(200, {});
			response.end(MONGO_YES);
			break;
		default:
		  response.writeHead(501, {});
			response.end(MONGO_NO);
			break;
	}
}

// Parses the request
parseRequest = function (request, response) {

	var parameters = parametersFromRequest(request);

	// Setup response
	response.body = "";

	// Logging
	sys.puts(request.method+" "+request.url);
	
	switch (request.method) {
		case "GET":
		  // GET to /db/collection - Return all or use conditions from 'query'
		  // query is given as querystring:
		  // GET /db/collection?query=%7B%22isDone%22%3A%20false%7D
			if (parameters['db']!='') {
				doQuery(request, response, parameters);
			} else {
				doCommand(request, response, parameters);
			}
			break;
		case "POST":
			if (parameters['command']!='') {
				doCommand(request, response, parameters);
			} else {
				insertDocuments(request, response, parameters);
			}
			break;
		case "PUT":
			updateDocument(request, response, parameters);
			break;
		case "DELETE":
			deleteDocument(request, response, parameters);
			break;
		default:
		  response.writeHead(501, {});
			response.end(MONGO_NO);
			break;
	}

}

exports.start = function(custom_settings) {
	settings = custom_settings || exports.default_settings;
	// Create the server
	http.createServer(function (request, response) {
		request.body = '';
		request.addListener('data', function(chunk){
			request.body += chunk;
		});
		request.addListener('end', function() {
			parseRequest(request, response);
		});
	}).listen(settings['server']['port'], settings['server']['address']);

	sys.puts("Server running at http://"+settings['server']['address']+":"+settings['server']['port']+"/");
}