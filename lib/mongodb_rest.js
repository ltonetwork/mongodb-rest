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

var sys = require("sys"), 
	mongo = require("./mongodb"),
	http = require("http"),
	url = require("url"),
	fs = require("fs"),
	EventEmitter = require("events").EventEmitter,
  inherits = require("sys").inherits;

var MongoDbRest = exports.MongoDbRest = function (settings) {
	this.debug = false;
	this.settings = settings || MongoDbRest.DEFAULT_SETTINGS;
  var self = this;
};

inherits(MongoDbRest, EventEmitter);

/*
 * flavorizeDocument - Changes JSON based on flavor settings 
 */
MongoDbRest.prototype.flavorizeDocument = function(doc, direction) {
	if (direction == "in") {
		if (this.settings['flavor'] == "sproutcore") {
			delete doc['guid']; // only do this in case flavor is set to sproutcore
		}
	} else {
		if (this.settings['flavor'] == "regular") {
			doc['_id'] = doc['_id'].toHexString();
		} else {
			var guid = doc['_id'].toHexString();
			delete doc['_id'];
			doc['guid'] = guid;
		}
	}
	return doc;
};

/*
 * parametersFromRequest - Returns a parameter hash, 'parsed' from the request object
 */
MongoDbRest.prototype.parametersFromRequest = function (request) {
	var result = {};
	var u = url.parse(unescape(request.url),true);
	var p = u.pathname.slice(1).split('/', 3)

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
	
	if (this.debug == true) sys.puts("parameters: "+sys.inspect(result));
	
	return result;
};

/*
 * returnDocuments - Returns JSON-ified documents
 */
MongoDbRest.prototype.returnDocuments = function (request, response, docs) {
	
	for (var d = 0; d < docs.length; d++) {
		docs[d] = this.flavorizeDocument(docs[d], 'out');
	}
	if (docs.length == 1) {
	  docs = docs[0];
	}
	
	response.body = JSON.stringify(docs);
	response.writeHead(200, { 
	  'Content-Type': 'application/json; charset=utf8', 
	  'Content-Length': response.body.length 
	});
  response.write(response.body, 'utf8');
  response.end();
};

/*
 * doQuery - Executes the query
 */
MongoDbRest.prototype.doQuery = function (request, response, parameters) {
	var self = this;
	var options = parameters['options'] || {};
	if (parameters['id']) {
		options = {'_id': mongo.ObjectID.createFromHexString(parameters['id'])};
	}
	var db = new mongo.Db(parameters['db'], new mongo.Server(this.settings['db']['host'], this.settings['db']['port'], {'auto_reconnect':true}));
	db.open(function(err,db) {
		db.collection(parameters['collection'], function(err, collection) {
			collection.find(options, function(err, cursor) {
				cursor.toArray(function(err, docs){
					self.returnDocuments(request, response, docs);
					db.close();
				});
			});
		});
	});
};

/*
 * insertDocuments - Inserts documents in the collection
 */
MongoDbRest.prototype.insertDocuments = function (request, response, parameters) {
	var db = new mongo.Db(parameters['db'], new mongo.Server(this.settings['db']['host'], this.settings['db']['port'], {'auto_reconnect':true}));
	
	db.open(function(err,db) {
		db.collection(parameters['collection'], function(err, collection) {
			collection.insert(parameters['options'], function(err, docs) {
				response.writeHead(201, {'Location': '/'+parameters['db']+'/'+parameters['collection']+'/'+docs[0]['_id'].toHexString()});
				response.end(MongoDbRest.MONGO_YES);
				db.close();
			});
		});
	});
};

/*
 * updateDocument - Updates a document in the collection
 */
MongoDbRest.prototype.updateDocument = function (request, response, parameters) {
	var spec = {'_id': mongo.ObjectID.createFromHexString(parameters['id'])};
	var options = this.flavorizeDocument(parameters['options'],'in');

	var db = new mongo.Db(parameters['db'], new mongo.Server(this.settings['db']['host'], this.settings['db']['port'], {'auto_reconnect':true}));
	db.open(function(err,db) {
		db.collection(parameters['collection'], function(err, collection) {
			collection.update(spec, options, true, function(err, docs) {
				response.writeHead( 200, {})
				response.end(MongoDbRest.MONGO_YES);
				db.close();
			});
		});
	});
};

/*
 * deleteDocument - Deletes a document from the collection
 */
MongoDbRest.prototype.deleteDocument = function (request, response, parameters) {
	var spec = {'_id': mongo.ObjectID.createFromHexString(parameters['id'])};
	var db = new mongo.Db(parameters['db'], new mongo.Server(this.settings['db']['host'], this.settings['db']['port'], {'auto_reconnect':true}));
	db.open(function(err,db) {
		db.collection(parameters['collection'], function(err, collection) {
			collection.remove(spec, function(err, docs) {
				response.writeHead( 200, {})
				response.end(MongoDbRest.MONGO_YES);
				db.close();
			});
		});
	});
};

/*
 * doCommand - Executes a command
 */
MongoDbRest.prototype.doCommand = function (request, response, parameters) {
	switch (parameters['command']) {
		default:
		  response.writeHead(501, {});
			response.end(MongoDbRest.MONGO_NO);
			break;
	}
};

/*
 * handleRequest - Handles a HTTP request
 */
MongoDbRest.prototype.handleRequest = function (request, response) {
	var self = this;
	var parameters = self.parametersFromRequest(request);
	response.body = "";	// Setup response
	sys.puts(request.method+" "+request.url);	// Logging
	
	switch (request.method) {
		case "GET":
			if (parameters['db']!='') {
				self.doQuery(request, response, parameters);
			} else {
				self.doCommand(request, response, parameters);
			}
			break;
		case "POST":
			if (parameters['command']!='') {
				self.doCommand(request, response, parameters);
			} else {
				self.insertDocuments(request, response, parameters);
			}
			break;
		case "PUT":
			self.updateDocument(request, response, parameters);
			break;
		case "DELETE":
			self.deleteDocument(request, response, parameters);
			break;
		default:
		  response.writeHead(501, {});
			response.end(MongoDbRest.MONGO_NO);
			break;
	}

};

MongoDbRest.MONGO_YES = JSON.stringify({"ok": 1})
MongoDbRest.MONGO_NO  = JSON.stringify({"ok": 0})
MongoDbRest.DEFAULT_SETTINGS = { "db": {
	'port': 27017,
	'host': "localhost"
	},
	'server': {
		'port': 3000,
		'address': "0.0.0.0"
	},
	'flavor': "regular"
};

MongoDbRest.prototype.start = function() {
	var self = this;
	// Create the server
	http.createServer(function (request, response) {
		request.body = '';
		request.addListener('data', function(chunk){
			request.body += chunk;
		});
		request.addListener('end', function() {
			self.handleRequest(request, response);
		});
	}).listen(self.settings['server']['port'], self.settings['server']['address']);

	sys.puts("Server running at http://"+self.settings['server']['address']+":"+self.settings['server']['port']+'/');
};