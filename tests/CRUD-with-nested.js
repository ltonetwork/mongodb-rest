var APIeasy = require('api-easy'),
	assert = require('assert'),
	sys = require("sys");

var testContext = {};
var initialDocument = {testField: 1, nested: { testField:'string' }};
var updateDocumentData = { nested: {testField: 2} };
var updatedDocument = {testField: 1, nested: { testField: 2 }};
var endpoint = "/test-db-crud-nested/test-collection";

var suite = APIeasy.describe('mongodb-rest post test');
suite.discuss('When using mongodb-rest API create/retrieve nested documents')
		.use('localhost', 3000)
		.setHeader('Content-Type', 'application/json')
		.post(endpoint, initialDocument)
			.expect(200)
			.expect('should respond with created document containing ID', function(err, res, body){
				var result = JSON.parse(body);
				assert.isObject(result.data);
				assert.isString(result.data._id);
				for(var i in initialDocument)
					assert.deepEqual(initialDocument[i], result.data[i]);
				
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
					assert.deepEqual(initialDocument[i], result.data[i]);
			})
		.next()
		.put(endpoint, updateDocumentData)
			.expect(200)
			.expect('should respond with updated document', function(err, res, body){
				var result = JSON.parse(body);
				assert.equal(result.data, true);
			})
		.next()
		.del(endpoint)
			.expect(200)
			.expect('should respond with deleted document', function(err, res, body){
				var result = JSON.parse(body);
				assert.equal(result.data, true);
				suite.unbefore('getID');
			})
		.next()
		.get(endpoint)
			.expect(200)
			.expect('should respond empty collection after delete', function(err, res, body){
				var result = JSON.parse(body);
				assert.isArray(result.data);
				assert.equal(result.data.length, 0);
			})
        .next()
        .del("/%/test-db-crud-nested")
            .expect(200)
.export(module);
