Credits
-------
https://github.com/ActiveUnits/mongodb-rest

Name
----

mongodb-rest2 - REST server for MongoDB

Description
-----------

This is a REST server for MongoDB using Node, using the native node.js MongoDB driver.

Major update, now using Express

Installation
------------

Installation is now via npm: `npm install http://github.com/ActiveUnits/mongodb-rest/tarball/master`.

API
-----

Supported REST requests:

* `GET /timestamp` - Returns server timestamp
* `GET /db/collection` - Returns all documents
* `GET /db/collection?query=urlencoded({isDone: false})` - Returns all documents satisfying query
* `GET /db/collection?query=urlencoded({isDone: false})&limit=2&skip=2` - add options to query (limit, skip are supported atm)
* `GET /db/collection/id` - Returns document with _id_
* `GET /db/collection/id?deep=true` - Returns document with _id_ and fetches all its deep nested object references
* `POST /db/collection` - Insert new document in collection (place insert json document in POST body)
  * when you need to post Object Reference send it as `{namespace: "collection", oid: "123dsas2sdasd"}`
* `PUT /db/collection/id` - Update document with _id_ (place update json document in PUT body)
  * when you need to update Object Reference send it as `{namespace: "collection", oid: "123dsas2sdasd"}`
  * when you send `{"field.innerField":"..."}` it will automaticly be converted to `{field:{innerField:"..."}`
* PUT /db/collection?query=urlencoded({isDone: false}) - update will get executed upon all documents in the collection
* `DELETE /db/collection/id` - Delete document with _id_
* `DELETE /db/collection?query=urlencoded({isDone: false})` - Delete all documents matching given query

Additions:

* method overriding: 
  * for PUT set header X-HTTP-Method-Override = PUT
  * for DELETE set header X-HTTP-Method-Override = DELETE
  * for POST set header X-HTTP-Method-Override = POST
* mongodb cluster connectivity (by providing array of `{ post: , host: }` objects in config.json

REST responses:

* all responses are containing `json({success: true or false, data: the data to be returned or which has been submitted})`

Usage
------------

## config.json ##

	{
		"dbconnection": {
			"port": 27017,
			"host": "localhost"
		},
		"port": 3000,
		"mode": "development",
		"autoStart": true
	}

## standalone ##

	npm install http://github.com/ActiveUnits/mongodb-rest/tarball/master -g
	mongodb-rest2

* Note that this will launch the mongodb-rest server by looking into the current directory for config.json
* You can alter the config location by passing `--config /path/to/config.json`

## inside node.js application ##

	var server = require("mongodb-rest2/server")
	var options = {
		"db": {
			"port": 27017,
			"host": "localhost",
			"name": "test-db"
		},
		"port": 3000,
		"mode": "development",
		"autoStart": false
	};
	var expressApp = server.create(options).start();

## hooking to mongodb-rest2 (secure mongodb-rest) ##
 
	var server = require("mongodb-rest2/server")
	var options = {
		"db": {
			"port": 27017,
			"host": "localhost",
			"name": "test-db"
		},
		"port": 3000,
		"mode": "development",
		"autoStart": false
	};
	var secureEveryRequestMiddleware = function(req, res, next) {
		if(req.param("token") != "myAuthToken") {
			res.send("Sorry", 401);
		} else
			next();
	}; 
	var expressApp = server.create(options, {
		"pre-router": function(expressApp) {
			expressApp.use(secureEveryRequestMiddleware);
		}
	}).start();

## using raw rest commands ##
    var target = { db: "name", collection:"name, connection: {host: "localhost", port: 27017} };
    
    var createCommand = require("mongodb-rest2/commands/create");
    createCommand(target, { field1: value1 }, function(err, doc) { });
    
    var updateCommand = require("mongodb-rest2/commands/update");
    updateCommand(target, { _id: value }, { field1: value1 }, { multi: true, safe: true }, function(err, docs) { });

    var listCommand = require("mongodb-rest2/commands/list");
    listCommand(target, { field1: value1 }, { limit: 10, skip: 20 }, function(err, docs) { });

    var deleteCommand = require("mongodb-rest2/commands/deleteCommand");
    deleteCommand(target, { field: value }, { safe: true }, function(err, docs) { } ); 

Testing
-------

Testing is now done using vows/api-easy. Just run `vows ./tests/*.js` in the main folder while you have the mongodb-rest2 running at port 3000

Credits
-------

* [mongodb-rest](http://github.com/tdegrunt/mongodb-rest)
* [MongoDB Driver](http://github.com/christkv/node-mongodb-native)
* [Express](http://expressjs.com/)
* [npm](http://npmjs.org/)
