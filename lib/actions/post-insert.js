/**
 * Route action for getting all databases names
 */

const connection = require('../helpers/connection');
const onError = require('../helpers/pass-error');

module.exports = postInsert;

function postInsert(request, response, config) {
    const logger = config.logger;
    const insertData = Array.isArray(request.body) ? request.body[0] : request.body;

    if(!request.body) {
        response.json([]);
        return;
    }

    connection.connectPromise(request.dbUri)
        .then(db => db.collection(request.params.collection), error => onError('Db open error: ', error))
        .then(collection => collection.insert(insertData), error => onError('Error getting collection: ', error))
        .then(result => response.onDone(result.ops[0], 201), error => onError('Error inserting into collection: ', error))
        .catch(error => response.onError('', error));
}
