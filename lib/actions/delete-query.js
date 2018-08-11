/**
 * Route action for deleting db records
 */

const connection = require('../helpers/connection');
const castId = require('../helpers/cast-id');
const onError = require('../helpers/pass-error');

module.exports = deleteQuery;

function deleteQuery(request, response, config) {
    const logger = config.logger;
    const spec = {'_id': castId(request.params.id)};

    connection.connectPromise(request.dbUri)
        .then(db => db.collection(request.params.collection), error => onError('Db open error: ', error))
        .then(collection => collection.remove(spec), error => onError('Error getting collection: ', error))
        .then(result => response.onDone(), error => onError('Error removing from collection: ', error))
        .catch(error => response.onError('', error));
}
