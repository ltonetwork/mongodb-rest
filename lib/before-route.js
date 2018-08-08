/**
 * Sort of middlewares, that have access to route params
 */

const endpoint = require('./helpers/endpoint');

module.exports = {
    setDbParamByEndpoint,
    checkDBAceess
};

//Set db param to empty string for 'databae' endpoint,
//to prevent it becoming 'undefined' where it is used for 'server' endpoint
function setDbParamByEndpoint(request, response, config) {
    const isDbEndpoint = endpoint.isDbEndpoint(config);
    if (isDbEndpoint) request.params.db = '';

    return true;
}

//Check if user can access db and collection
function checkDBAceess(request, response, config) {
    const allowed = config.dbAccessControl;
    const skip = typeof allowed === 'undefined';
    if (skip) return true;

    var allow = true;
    const db = request.params.db;
    const collection = request.params.collection;
    const isDbEndpoint = endpoint.isDbEndpoint(config);

    if (isDbEndpoint) {
        allow = typeof collection === 'undefined' || !allowed.length || allowed.indexOf(collection) > -1;
    } else if (db)  {
        const allowedCollections = allowed[db];

        allow = typeof allowedCollections !== 'undefined' &&
            (typeof collection === 'undefined' ||
                !allowedCollections.length ||
                allowedCollections.indexOf(collection) > -1);
    }

    if (!allow) {
        response.status(403);
        response.json('Access to db is not allowed');
    }

    return allow;
}
