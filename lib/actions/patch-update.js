/**
 * Route action for updating existing records in db
 */

const connection = require('../helpers/connection');
const prepareUpdateData = require('../helpers/patch-data');
const onError = require('../helpers/pass-error');
const castId = require('../helpers/cast-id');

module.exports = putUpdate;

function putUpdate(request, response, config) {
    const logger = config.logger;
    const spec = {'_id': castId(request.params.id)};
    const updateData = prepareUpdateData(request.body);
    if (!updateData) {
        return response.status(400).json({ message: 'Update data should not be empty' });
    }

    var collection = null;

    connection.connectPromise(request.dbUri)
        .then(db => db.collection(request.params.collection), error => onError('Db open error: ', error))
        .then(coll => (collection = coll) && collection.updateOne(spec, updateData), error => onError('Error getting collection: ', error))
        .then(result => fetchUpdated(result), error => onError('Error performing update: ', error))
        .then(docs => response.onDone(docs[0]), error => onError('Error finding updated documents: ', error))
        .catch(error => response.onError('', error));

    //Fetch updated record
    function fetchUpdated(result) {
        return result.result.n ?
            collection.find(spec).toArray() :
            [];
    }
}
