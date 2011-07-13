var APIeasy = require('api-easy'),
	assert = require('assert');

var suite = APIeasy.describe('mongodb-rest');

suite.discuss('When using mongodb-rest API')
		.use('localhost', 3000)
		.setHeader('Content-Type', 'application/json')
		.get("/")
			.expect(200)
.export(module);