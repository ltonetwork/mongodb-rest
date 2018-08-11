/**
 * Sort of middlewares, that have access to route params
 */

const endpoint = require('./helpers/endpoint');

module.exports = {
    setResponseMethods,
    setDbParamByEndpoint,
    setDbUri,
    checkDBAceess
};

//Set custom response methods
function setResponseMethods(request, response, config) {
    response.onDone = function(data, code) {
        if (typeof code === 'undefined') code = 200;
        if (typeof data === 'undefined') data = { ok: 1 };

        this.status(code).json(data);
    }

    response.onError = function(prefix, error, code) {
        if (typeof code === 'undefined') code = 500;

        config.logger.error(prefix + error.message);
        this.status(500).json({ message: 'Server error' });
    }

    return true;
}

//Set db param to empty string for 'databae' endpoint,
//to prevent it becoming 'undefined' where it is used for 'server' endpoint
function setDbParamByEndpoint(request, response, config) {
    const isDbEndpoint = endpoint.isDbEndpoint(config);
    if (isDbEndpoint) request.params.db = '';

    return true;
}

//Set db uri custom param
function setDbUri(request, response, config) {
    request.dbUri = config.baseDbUri;

    if (request.params.db) {
        request.dbUri += '/' + request.params.db;
    }

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
