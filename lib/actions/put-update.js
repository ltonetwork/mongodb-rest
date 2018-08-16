/**
 * Route action for updating existing records in db
 */

const validator = new require('ajv')();
const connection = require('../helpers/connection');
const castId = require('../helpers/cast-id');
const onError = require('../helpers/pass-error');
const getSchemaForRequest = require('../helpers/request-schema');

module.exports = putUpdate;

function putUpdate(request, response, config) {
    const logger = config.logger;
    const spec = {'_id': castId(request.params.id)};
    var collection = null;

    const schema = getSchemaForRequest(request, config);
    const isValid = !schema || validator.validate(schema, request.body);

    if (!isValid) {
        return response.status(400).json({ message: 'Updating document won\'t match predefined schema' });
    }

    connection.connectPromise(request.dbUri)
        .then(db => db.collection(request.params.collection), error => onError('Db open error: ', error))
        .then(coll => (collection = coll) && collection.updateOne(spec, request.body), error => onError('Error getting collection: ', error))
        .then(result => fetchUpdated(result), error => onError('Error performing update: ', error))
        .then(docs => response.onDone(docs[0]), error => onError('Error finding updated documents: ', error))
        .catch(error => response.onError('', error));

    function fetchUpdated(result) {
        return result.result.n ?
            collection.find(spec).toArray() :
            [];
    }
}
