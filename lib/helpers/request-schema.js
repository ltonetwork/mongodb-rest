/**
 * Fetch json schema for validating request
 */

const endpoint = require('./endpoint');

module.exports = getSchemaForRequest;

function getSchemaForRequest(request, config) {
    if (typeof config.schema === 'undefined') return null;

    const dbs = Object.keys(config.schema);
    if (!dbs.length) return null;

    const isDbEndpoint = endpoint.isDbEndpoint(config);
    const db = isDbEndpoint ? dbs[0] : request.params.db;
    const collection = request.params.collection;

    const dbSchemas = config.schema[db];
    if (typeof dbSchemas === 'undefined') return null;

    const schema = dbSchemas[collection];
    return typeof schema !== 'undefined' ? schema : null;
}
