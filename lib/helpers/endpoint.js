/**
 * Determine an endpoint
 */

module.exports = {
    isDbEndpoint
};

//Determine if we use database endpoint
function isDbEndpoint(config) {
    const endpoint = config.endpoint_root;
    var isDbEndpoint = false;

    if (typeof endpoint !== 'undefined') {
        if (['server', 'database'].indexOf(endpoint) === -1) {
            throw new Error('Invalid "endpoint_root" config.');
        }

        isDbEndpoint = endpoint === 'database';
    }

    return isDbEndpoint;
}
