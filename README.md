mongodb-rest [![Build Status](https://travis-ci.org/codecapers/mongodb-rest.png)](https://travis-ci.org/codecapers/mongodb-rest)
============

A simple but incredibly useful REST API server for MongoDB using Node, using Express and the native node.js MongoDB driver.

As Tom has said this REST server has no security and is not fit for use in production. So be warned! Work is currently being done to improve the security of mongodb-rest, but this is still a work-in-progress.

I have found this REST server to be invaluable for rapid prototyping web applications. When you don't care about security and you just need to try something out without investing the time to build a proper secure REST API.

Recent Updates
--------------

A simple token-based authentication has been added to mongodb-rest (thanks to @ZECTBynmo). This is a prototype feature only and may change in the future. I am considering making authentication plugin-based so you can roll your own if necessary. If you have any thoughts on how this should work please let us know.

Installation
------------

Installation is via npm: 
> npm install mongodb-rest

You can install globally using -g: 
> npm install -g mongodb-rest

Now issue `mongodb-rest` on the command line and the server should start.

NOTE: Make sure you are running a MongoDB database in addition to the mongodb-rest server.

Test
----

After installation you can quickly test it by issuing the following from the command line:<br/>
> curl -d '{ "A1" : 201 }' -H "Content-Type: application/json" http://localhost:3000/test/example1

This should add a document to the "test" db.example1 collection:

	{
		"A1": 201,
		"_id": ObjectId("4e90e196b0c7f4687000000e")
	}

Start Server Programmatically
-----------------------------

mongodb-rest can easily be started programmatically by 'requiring' the module and calling `startServer`.

	var mongodbRest = require('mongodb-rest');
	mongodbRest.startServer();

You can optionally pass in a configuration object:

	mongodbRest.startServer(config);

Configuration
-------------

When starting from the command line you should have `config.json` in the current working directory. The project includes an example configuration file.

When starting the server programmatically you can pass in a Javascript object for mongodb-rest configuration.

Here is an example JSON configuration object:

	{ 
		"db": "mongodb://localhost:27017",
		"server": {
			"port": 3000,
			"address": "0.0.0.0"
		},
		"accessControl": {
			"allowOrigin": "*",
			"allowMethods": "GET,POST,PUT,DELETE,HEAD,OPTIONS",
			"allowCredentials": false
		},
	    "mongoOptions": {
	        "serverOptions": {
	        },
	        "dbOptions": {
	            "w": 1
	        }
	    },
		"humanReadableOutput": true,
		"urlPrefix": ""
	}

`db` specifies the mongodb connection string for connection to the database. It defaults when not specified.

For documentation on the mongodb connection string: http://docs.mongodb.org/manual/reference/connection-string/

For backward compatibility `db` can also be set to an object that specified `host` and `port` as follows:

	"db": {
		"port": 27017,
		"host": "localhost"
	},

`server` specifies the configuration for the REST API server, it also defaults if not specified.

`mongoOptions` specifies MongoDB server and database connection parameters. These are passed directly to the MongoDB API.

Valid options under `serverOptions` are documented here: http://mongodb.github.io/node-mongodb-native/api-generated/server.html.

`auto_reconnect` is automatically enabled, don't override this or mongodb-rest may not work as expected.

Valid options under `dbOptions` are documented here: http://mongodb.github.io/node-mongodb-native/api-generated/db.html.

`w` (write concern) is set to 1 so that acknowledgement of the write is recieved by mongodb-rest, currently this must be enabled for error checking.

Set `collectionOutputType` to `csv` to returns collections as csv data rather than json.

If you are configuring the server procedurally you can assign a Javascript function to `transformCollection` which will transform each collection before returning it via HTTP.

The `accessControl` options allow you to set the following headers on the HTTP response:
- Access-Control-Allow-Origin
- Access-Control-Allow-Methods
- Access-Control-Allow-Credentials

Help for these headers can be found here:
https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS

The `urlPrefix` option allows specification of a prefix for the REST API URLs. This defaults to an empty string, meaning no prefix which was the original behavior. For example, given the following REST API URL:

	/database/collection

Setting a URL prefix of `/blah` will change the example REST API URL to:

	/blah/database/collection

The URL prefix should allow the REST API to co-exist with another REST API and can also be used a very primitive form of security (by setting the prefix to a _secret key_).

Logging
-------

Winston logging is supported if you configure the REST API programmatically. When you call `startServer` and pass in configuration options set the `logger` option to your Winston logger. Mongodb-rest uses the following functions: verbose, info, warn and error.

Please see the Winston documentation for more setup details: https://github.com/flatiron/winston

Supported REST API
------------------

Supported REST API requests:

* `GET /dbs` - Returns the names of all databases.
* `GET /<db>/` - Returns names of all collections in the specified database.
* `GET /<db>/<collection>` - Returns all documents in the specified collection.
* `GET /<db>/<collection>?output=csv` - Returns all documents in collection in csv format.
* `GET /<db>/<collection>?query=%7B%22isDone%22%3A%20false%7D` - Returns all documents satisfying query.
* `GET /<db>/<collection>?query=%7B%22isDone%22%3A%20false%7D&limit=2&skip=2` - Ability to add options to query (limit, skip, 
etc)
* `GET /<db>/<collection>/id` - Returns document with _id_
* `POST /<db>/<collection>` - Insert new document in collection (document in POST body)
* `PUT /<db>/<collection>/id` - Update document with _id_ (updated document in PUT body)
* `DELETE /<db>/<collection>/id` - Delete document with _id_

Content Type:

* Please make sure `application/json` is used as Content-Type when using POST/PUT with request bodies.

Dependencies
------------

* Are indicated in package.json. 

Auth
----

**WARNING: This is a prototype feature and may change in the future**.

mongodb-rest supports a simple token-based auth system. Login is accomplilshed by a HTTP POST to `/login` with `username` and `password`, the server will verify the user's password against a secret database. Upon authentication an access token is returned that must be attached to each subsequent API requests.

An authorization token is specified via query parameter as follows:

```
GET /db/collection?token=234d43fdg-34324d-dd-dsdf-f435d
```

Authentication is enabled by adding `auth` to config.json as follows:

	"auth": {
		"usersDBConnection": "mongodb://localhost/auth",
		"usersCollection": "users",
		"tokenDBConnection": "mongodb://localhost/auth",
		"tokensCollectionName": "tokens",
		"universalAuthToken": "this-token-grants-universal-access-so-please-change-it",
		"tokenExpirationTimeHours": 8
	}

`auth` requires at least:

* usersDBConnection - mongodb connection string for the users database.
* tokenDBConnection - mongodb connection string for the tokens database.

Here are the docs for mongodb connection strings: http://docs.mongodb.org/manual/reference/connection-string/

The following are optional:

* usersCollection - The auth database collection where users are stored.
* tokensCollectionName - The auth database collection where tokens are stored.
* universalAuthToken - Specifies a token that can be used for universal authorization.
* tokenExpirationTimeHours - Specifies the timeout in hours before tokens must be renewed by 'login'.

An example configuration `example config with auth.json` is included with a working authentication setup.

** Please note that mongodb exposes all databases in the server, including your secret authentication database. Move your auth database to a different server on the same machine or ensure MongoDB authentication is setup correctly. Work will be done in the future that allows particular databases to be whitelisted/blacklisted and not exposed. **


Getting the Code
----------------

You can get the code by forking/cloning the repo at:

 https://github.com/codecapers/mongodb-rest.git

Testing
-------

Integration tests use jasmine-node. 

Run 'jasmine-node' from the main folder: 

>jasmine-node .\ --verbose

Travis-CI
---------

https://travis-ci.org/ashleydavis/mongodb-rest

Future
------

Roadmap:<br/>
https://trello.com/b/OzRxPSjO/mongodb-rest-roadmap

Credits
-------

* [MongoDB Driver](http://github.com/christkv/node-mongodb-native)
* [Express](http://expressjs.com/)
* [npm](http://npmjs.org/)

Testing:
* [Jasmine-Node](https://github.com/mhevery/jasmine-node)
* [Q (for async testing)](https://github.com/kriskowal/q)
