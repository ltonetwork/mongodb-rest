'use strict';

/**
 * Unit tests
 */

const endpoint = require('../lib/helpers/endpoint');

describe('mongodb-rest', function () {
    function isDbEndpointProvider() {
        return [
            {note: 'sets an endpoint to "server" if no "endpoint_root" given', config: {}, expected: false},
            {note: 'sets an endpoint to "server" from "endpoint_root"', config: {endpoint_root: 'server'}, expected: false},
            {note: 'sets an endpoint to "database" from "endpoint_root"', config: {endpoint_root: 'database'}, expected: true},
        ];
    }

    isDbEndpointProvider().forEach(function(item) {
        it(item.note, function () {
            const result = endpoint.isDbEndpoint(item.config);

            expect(result).toBe(item.expected);
        });
    });

    it('expects exception that wrong endpoint is set', function() {
        expect(function() {
            const config = {endpoint_root: 'foo'};
            endpoint.isDbEndpoint(config);
        }).toThrow('Invalid "endpoint_root" config.');
    });
});
