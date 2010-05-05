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

// To run these tests, you'll need the async_testing library and have the node server running
// There should be no database called 'mongodbrest' and no collection 'tests' in that database.

var sys = require('sys'),
	http = require('http'),
	MongoDbRest = require('../lib/mongodb_rest').MongoDbRest,
	TestSuite = require('async_testing/async_testing').TestSuite;

var OK_RESPONSE = "{\"ok\":1}";
var FIXTURE_TEST = {"test": "Create a document"};
var FIXTURE_UPDATED = {"test": "Updated a document"};
var testCreatedId = "";

var suite = exports["Simple REST Suite"] = new TestSuite();
suite.setup(function () {
	this.client = http.createClient(3000, '127.0.0.1');
});

suite.teardown( function () {
	this.client = null;
});
	
suite.addTests({
	"Create a Document": function (assert, finished, test) {
		var request = test.client.request('POST', '/mongodbrest/tests', {});
		request.addListener('response', function (response) {
		  assert.equal(response.statusCode, 201, "Response status should be 201");
		  var locationHeaderArray = response.headers['location'].slice(1).split('/'); 
		  assert.equal(locationHeaderArray.length, 3);
		  testCreatedId = locationHeaderArray[2];

		  assert.equal(testCreatedId.length, 24);

		  response.setEncoding('utf8');
		  response.addListener('data', function (chunk) {
		    assert.equal(chunk, OK_RESPONSE)
				finished();
		  });

		});
		request.write(JSON.stringify(FIXTURE_TEST));
		request.end();
	},
	"Retrieve a Document": function (assert, finished, test) {
		var request = this.client.request('GET', "/mongodbrest/tests/"+testCreatedId, {});
	  request.addListener('response', function (response) {
	    assert.equal(response.statusCode, 200, "Response status should be 200");
    
	    response.setEncoding('utf8');
	    response.addListener('data', function (chunk) {
	      var object = JSON.parse(chunk);
  
	      assert.equal(object['_id'], testCreatedId);
				assert.equal(object['test'], FIXTURE_TEST['test']);
				finished();
	    });
	  });
	  request.end();
	},
	"Retrieve a Collection": function (assert, finished, test) {
		var request = this.client.request('GET', "/mongodbrest/tests", {});
	  request.addListener('response', function (response) {
	    assert.equal(response.statusCode, 200, "Response status should be 200");
    
	    response.setEncoding('utf8');
	    response.addListener('data', function (chunk) {
	      var object = JSON.parse(chunk);
	      assert.equal(object.length, 1);
				finished();
	    });
	  });
	  request.end();		
	},
	"Update a Document": function (assert, finished, test) {
	  var request = test.client.request('PUT', "/mongodbrest/tests/"+testCreatedId, {});
	  request.addListener('response', function (response) {
	    assert.equal(response.statusCode, 200, "Response status should be 200");

	    response.setEncoding('utf8');
	    response.addListener('data', function (chunk) {
		    assert.equal(chunk, OK_RESPONSE);
	    });

			// Check if indeed the document was updated
			var request = test.client.request('GET', "/mongodbrest/tests/"+testCreatedId, {});
		  request.addListener('response', function (response) {
		    assert.equal(response.statusCode, 200, "Response status should be 200");

		    response.setEncoding('utf8');
		    response.addListener('data', function (chunk) {
		      var object = JSON.parse(chunk);

		      assert.equal(object['_id'], testCreatedId);
					assert.equal(object['test'], FIXTURE_UPDATED['test']);
					finished();
		    });
			});

	  });
		request.write(JSON.stringify(FIXTURE_UPDATED));
	  request.end();		
	},
	"Delete a Document": function (assert, finished, test) {
	  var request = test.client.request('DELETE', "/mongodbrest/tests/"+testCreatedId, {});
	  request.addListener('response', function (response) {
	    assert.equal(response.statusCode, 200, "Response status should be 200");

	    response.setEncoding('utf8');
	    response.addListener('data', function (chunk) {
		    assert.equal(chunk, OK_RESPONSE);
	    });

			// Check if indeed the document was indeed deleted
			var request = test.client.request('GET', "/mongodbrest/tests/"+testCreatedId, {});
		  request.addListener('response', function (response) {
		    assert.equal(response.statusCode, 404, "Response status should be 404");
				finished();
			});

	  });
	  request.end();		
	},
	"Retrieve an empty collection": function (assert, finished, test) {
		var request = this.client.request('GET', "/mongodbrest/tests", {});
	  request.addListener('response', function (response) {
	    assert.equal(response.statusCode, 200, "Response status should be 200");
			response.setEncoding('utf8');
	    response.addListener('data', function (chunk) {
		    assert.equal(chunk, "[]");
				finished();
	    });
	  });
	  request.end();		
	},
});

require('async_testing/async_testing').runSuites({'REST Suite': suite});
