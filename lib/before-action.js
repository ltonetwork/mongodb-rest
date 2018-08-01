/**
 * Sort of middlewares, that have access to route params
 */

const endpoint = require('./helpers/endpoint');

module.exports = function (request, response, config) {
    const execute = [
        setDbParamByEndpoint
    ];

    for (var i = 0; i < execute.length; i++) {
        var result = execute[i](request, response, config);
        if (!result) return false;
    }

    return true;
};

//Set db param to empty string for 'databae' endpoint,
//to prevent it becoming 'undefined' where it is used for 'server' endpoint
function setDbParamByEndpoint(request, response, config) {
    const isDbEndpoint = endpoint.isDbEndpoint(config);
    if (isDbEndpoint) request.params.db = '';

    return true;
}
