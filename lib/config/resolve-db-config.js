/**
 * Configuration for db connection
 */

module.exports = {
    with: resolveWith
};


/**
 * Return db settings
 * @param  {object} config
 * @return {object}
 */
function resolveWith(config) {
    if (!config.db) {
        throw new Error('config.db is not defined!');
    }

    var baseUri;

    if (typeof config.db === 'string') {
        baseUri = config.db;
    } else if (config.db) {
        // Old style configuration, for backward compatibility.
        baseUri = 'mongodb://';

        if (config.db.username && config.db.password) {
            baseUri += config.db.username + ':' + config.db.password + '@';
        }

        baseUri += config.db.host;

        if (config.db.port) {
            baseUri += ':' + config.db.port;
        }
    }

    return {baseUri};
}
