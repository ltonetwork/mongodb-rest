/**
 * Route action for updating existing records in db
 */

const connection = require('../helpers/connection');
const prepareUpdateData = require('../helpers/patch-data');
const onError = require('../helpers/pass-error');
const castId = require('../helpers/cast-id');
const getSchemaForRequest = require('../helpers/request-schema');
const partialJsonValidate = require('../helpers/partial-json-validate');

module.exports = patchUpdate;

function patchUpdate(request, response, config) {
    const logger = config.logger;
    const spec = {'_id': castId(request.params.id)};
    const updateData = prepareUpdateData(request.body);
    const schema = getSchemaForRequest(request, config);
    if (!updateData) {
        return response.status(400).json({ message: 'Update data should not be empty' });
    }

    var collection = null;

    connection.connectPromise(request.dbUri)
        .then(db => db.collection(request.params.collection), error => onError('Db open error: ', error))
        .then(coll => (collection = coll) && collection.findOne(spec), error => onError('Error getting collection: ', error))
        .then(doc => partialJsonValidate(request, doc, updateData, schema), error => onError('Error finding document: ', error))
        .then(isValid => {
            if (!isValid) return response.status(400).json({ message: 'Updating document won\'t match predefined schema'});

            return collection.updateOne(spec, updateData)
                .then(result => fetchUpdated(result), error => onError('Error performing update: ', error))
                .then(doc => response.onDone(doc), error => onError('Error finding updated document: ', error))
        })
        .catch(error => response.onError('', error));

    //Fetch updated record
    function fetchUpdated(result) {
        return result.result.n ?
            collection.findOne(spec) :
            [];
    }
}
