var APIeasy = require('api-easy'),
	assert = require('assert'),
	sys = require("sys");

var testContext = {};
var initialDocument =  {"prop1":"asdasdsad","prop3":"88.1","prop2":"88"};
var updateDocumentData = {"prop1":"1111111"};
var updatedDocument = {"prop1":"1111111","prop3":"88.1","prop2":"88"};
var endpoint = "/test-db-crud-flex/test-collection";

var suite = APIeasy.describe('mongodb-rest post test');
suite.discuss('When using mongodb-rest API create/retrieve')
		.use('localhost', 3000)
		.setHeader('Content-Type', 'application/json')
		.post(endpoint, initialDocument)
			.expect(200)
			.expect('should respond with created document containing ID', function(err, res, body){
				var result = JSON.parse(body);
				assert.isObject(result.data);
				assert.isString(result.data._id);
				for(var i in initialDocument)
					assert.equal(initialDocument[i], result.data[i]);
				
				testContext.id = result.data._id;
				suite.before('getID', function(outgoing){
					outgoing.uri += "/"+result.data._id;
					return outgoing;
				});
			})
		.next()
		.get(endpoint)
			.expect(200)
			.expect('should respond with previously created document', function(err, res, body){
				var result = JSON.parse(body);
				
				assert.isObject(result.data);
				assert.isString(result.data._id);
				assert.equal(result.data._id, testContext.id);
				for(var i in initialDocument)
					assert.equal(initialDocument[i], result.data[i]);
			})
		.next()
		.setHeader('x-http-method-override', 'PUT')
		.post(endpoint, updateDocumentData)
			.expect(200)
			.expect('should respond with success', function(err, res, body){
				var result = JSON.parse(body);
				assert.equal(result.data, true);
			})
		.next()
		.removeHeader('x-http-method-override')
		.get(endpoint)
			.expect(200)
			.expect('should respond with updated document', function(err, res, body){
				var result = JSON.parse(body);
				
				assert.isObject(result.data);
				assert.isString(result.data._id);
				assert.equal(result.data._id, testContext.id);
				for(var i in updatedDocument)
					assert.equal(updatedDocument[i], result.data[i]);
			})
		.next()
		.setHeader('x-http-method-override', 'DELETE')
		.post(endpoint)
			.expect(200)
			.expect('should respond with deleted document', function(err, res, body){
				var result = JSON.parse(body);
				assert.equal(result.data, true);
				suite.unbefore('getID');
			})
		.next()
		.removeHeader('x-http-method-override')
		.get(endpoint)
			.expect(200)
			.expect('should respond empty collection after delete', function(err, res, body){
				var result = JSON.parse(body);
				assert.isArray(result.data);
				assert.equal(result.data.length, 0);
			})
        .next()
        .del("/%/test-db-crud-flex")
            .expect(200)
.export(module);
