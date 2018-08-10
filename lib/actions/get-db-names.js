/**
 * Route action for getting all databases names
 */

const connection = require('../helpers/connection');
const endpoint = require('../helpers/endpoint');
const onError = require('../helpers/pass-error');

module.exports = getDbNames;

function getDbNames(request, response, config) {
    const logger = config.logger;

    if (endpoint.isDbEndpoint(config)) {
        response.json([]);
        return;
    }

    connection.connectPromise(config.baseDbUri)
        .then(db => db.admin().listDatabases(), error => onError('Db open error: ', error))
        .then(dbs => returnList(dbs), error => onError('Error getting databases names: ', error))
        .then(names => response.onDone(names))
        .catch(error => response.onError('', error));

    //Map databases to their names
    function returnList(dbs) {
        const names = dbs.databases.map(function(db) {
            return db.name;
        });

        return names;
    }
}
