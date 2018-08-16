'use strict';

/**
 * Unit tests
 */

const castId = require('../lib/helpers/cast-id');
const endpoint = require('../lib/helpers/endpoint');
const preparePatchData = require('../lib/helpers/patch-data');
const getSchemaForRequest = require('../lib/helpers/request-schema');
const beforeRoute = require('../lib/before-route');
const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;

describe('mongodb-rest:unit', function () {
    function isDbEndpointProvider() {
        return [
            {note: 'sets an endpoint to "server" if no "endpoint_root" given', config: {}, expected: false},
            {note: 'sets an endpoint to "server" from "endpoint_root"', config: {endpoint_root: 'server'}, expected: false},
            {note: 'sets an endpoint to "database" from "endpoint_root"', config: {endpoint_root: 'database'}, expected: true},
        ];
    }

    isDbEndpointProvider().forEach(function(spec) {
        it(spec.note, function () {
            const result = endpoint.isDbEndpoint(spec.config);

            expect(result).toBe(spec.expected);
        });
    });

    it('expects exception that wrong endpoint is set', function() {
        expect(function() {
            const config = {endpoint_root: 'foo'};
            endpoint.isDbEndpoint(config);
        }).toThrow('Invalid "endpoint_root" config.');
    });

    function setDbParamByEndpointProvider() {
        return [
            {note: 'sets empty db request parameter for database endpoint mode', config: {endpoint_root: 'database'}, expected: {params: {db: ''}}},
            {note: 'do not set empty db request parameter for server endpoint mode', config: {endpoint_root: 'server'}, expected: {params: {}}},
            {note: 'do not set empty db request parameter if endpoint_root is not set', config: {}, expected: {params: {}}}
        ];
    }

    setDbParamByEndpointProvider().forEach(function(spec) {
        it(spec.note, function() {
            const request = {params: {}};
            const response = {};
            const config = spec.config;

            const result = beforeRoute.setDbParamByEndpoint(request, response, config);

            expect(result).toBe(true);
            expect(request).toEqual(spec.expected);
        });
    });

    function checkDBAccessProvider() {
        return [
            {
                note: 'allow access if allowed config is not set',
                params: {db: 'foo'},
                config: {},
                expected: true
            },
            {
                note: 'allow access for collection, if allowed config is not set',
                params: {db: 'foo', collection: 'bar'},
                config: {},
                expected: true
            },
            {
                note: 'allow access if db is allowed in config',
                params: {db: 'foo'},
                config: {dbAccessControl: {foo: []}},
                expected: true
            },
            {
                note: 'allow access if db is allowed in config with some collections',
                params: {db: 'foo'},
                config: {dbAccessControl: {foo: ['bar_collection']}},
                expected: true
            },
            {
                note: 'allow access if db is allowed in config, for all collection',
                params: {db: 'foo', collection: 'bar'},
                config: {dbAccessControl: {foo: []}},
                expected: true
            },
            {
                note: 'allow access if db and collection is allowed in config',
                params: {db: 'foo', collection: 'bar'},
                config: {dbAccessControl: {foo: ['zoo', 'bar']}},
                expected: true
            },
            {
                note: 'do not allow access if db is not allowed in config',
                params: {db: 'foo', collection: 'bar'},
                config: {dbAccessControl: {zoo: ['baz', 'bar']}},
                responseCode: 403,
                responseMessage: 'Access to db is not allowed',
                expected: false
            },
            {
                note: 'do not allow access if collection is not allowed in config',
                params: {db: 'foo', collection: 'bar'},
                config: {dbAccessControl: {foo: ['baz', 'boo']}},
                responseCode: 403,
                responseMessage: 'Access to db is not allowed',
                expected: false
            },

            {
                note: 'allow access if allowed config is not set, for database endpoint',
                params: {collection: 'bar'},
                config: {endpoint_root: 'database'},
                expected: true
            },
            {
                note: 'allow access if all collections are allowed in config, for database endpoint',
                params: {collection: 'bar'},
                config: {dbAccessControl: [], endpoint_root: 'database'},
                expected: true
            },
            {
                note: 'allow access if collection is allowed in config, for database endpoint',
                params: {collection: 'bar'},
                config: {dbAccessControl: ['baz', 'bar'], endpoint_root: 'database'},
                expected: true
            },
            {
                note: 'do not allow access if collection is not allowed in config, for database endpoint',
                params: {collection: 'bar'},
                config: {dbAccessControl: ['baz', 'boo'], endpoint_root: 'database'},
                responseCode: 403,
                responseMessage: 'Access to db is not allowed',
                expected: false
            },
        ];
    }

    checkDBAccessProvider().forEach(function(spec) {
        it(spec.note, function() {
            const config = spec.config;
            const request = {params: spec.params};
            const response = {
                status: function(code) {
                    this.responseCode = code;
                },
                json: function(message) {
                    this.responseMessage = message;
                }
            };

            const result = beforeRoute.checkDBAceess(request, response, config);

            expect(result).toBe(spec.expected);

            if (!spec.expected) {
                expect(response.responseCode).toBe(spec.responseCode);
                expect(response.responseMessage).toBe(spec.responseMessage);
            }
        });
    });

    function castIdProvider() {
        return [
            {note: 'should not cast integer id', id: 23, expected: 23},
            {note: 'should not cast numeric id', id: '23', expected: '23'},
            {note: 'should not cast string id', id: 'foo', expected: 'foo'},
            {note: 'should cast hex id', id: '5b68a4c62e5cfd380d73ea48', expected: new ObjectID('5b68a4c62e5cfd380d73ea48')},
        ];
    }

    castIdProvider().forEach(function(spec) {
        it(spec.note, function() {
            const castedId = castId(spec.id);

            if (spec.expected instanceof ObjectID) {
                expect(castedId instanceof ObjectID).toBe(true);
                expect(castedId.toString()).toEqual(spec.expected.toString());
            } else {
                expect(castedId).toEqual(spec.expected);
            }
        });
    });

    function patchDataProvider() {
        return [
            {
                note: 'prepare patch data for empty data',
                data: [],
                expected: null
            },
            {
                note: 'prepare patch data, if there are no delete fields',
                data: {foo: 'bar', zoo: 'baz'},
                expected: {$set: {foo: 'bar', zoo: 'baz'}}
            },
            {
                note: 'prepare patch data, if there are no set fields',
                data: {foo: null, zoo: null},
                expected: {$unset: {foo: '', zoo: ''}}
            },
            {
                note: 'prepare patch data with both delete and set fields',
                data: {foo: 'bar', zoo: null},
                expected: {$set: {foo: 'bar'}, $unset: {zoo: ''}}
            },
        ];
    }

    patchDataProvider().forEach(function(spec) {
        it(spec.note, function() {
            const data = preparePatchData(spec.data);

            expect(data).toEqual(spec.expected);
        });
    });

    function requestSchemaProvider() {
        return [
            {
                note: 'returns null for schema, if schema is not set in config',
                params: {db: 'foo_db', collection: 'foo_coll'},
                config: {},
                expected: null
            },
            {
                note: 'returns null for schema, if schema is an empty object',
                params: {db: 'foo_db', collection: 'foo_coll'},
                config: {schema: {}},
                expected: null
            },
            {
                note: 'returns null for schema, if schema is not set for given db',
                params: {db: 'foo_db', collection: 'foo_coll'},
                config: {schema: {bar_db: {bar_coll: 'some_schema'}}},
                expected: null
            },
            {
                note: 'returns null for schema, if schema is not set for given collection',
                params: {db: 'foo_db', collection: 'foo_coll'},
                config: {schema: {foo_db: {bar_coll: 'some_schema'}}},
                expected: null
            },
            {
                note: 'returns null for schema, if schema is not set in config, for database endpoint',
                params: {collection: 'foo_coll'},
                config: {endpoint_root: 'database'},
                expected: null
            },
            {
                note: 'returns null for schema, if schema is an empty object, for database endpoint',
                params: {collection: 'foo_coll'},
                config: {schema: {}},
                expected: null
            },
            {
                note: 'returns schema for given request',
                params: {db: 'foo_db', collection: 'foo_coll'},
                config: {schema: {foo_db: {foo_coll: 'some_schema'}}},
                expected: 'some_schema'
            },
            {
                note: 'returns schema for given request, for database endpoint',
                params: {collection: 'foo_coll'},
                config: {schema: {foo_db: {foo_coll: 'some_schema'}}, endpoint_root: 'database'},
                expected: 'some_schema'
            },
        ];
    }

    requestSchemaProvider().forEach(function(spec) {
        it(spec.note, function() {
            const request = {params: spec.params};
            const result = getSchemaForRequest(request, spec.config);

            expect(result).toBe(spec.expected);
        });
    });
});
