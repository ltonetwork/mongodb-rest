/**
 * Perform validation of document part, using json schema
 */

const validator = new require('ajv')();
const uuid = require('uuid/v4');
const extend = require('extend');
const connection = require('../helpers/connection');
const onError = require('../helpers/pass-error');

module.exports = partialJsonValidate;

function partialJsonValidate(request, doc, part, schema) {
    if (!schema) return true;

    doc = extend(true, {}, doc);
    doc._id = uuid(); //Use arbitrary id
    const spec = {'_id': doc._id};
    const collectionName = '__partial_json_validation';

    var collection = null;
    var isValid = false;

    return connection.connectPromise(request.dbUri)
        .then(db => db.collection(collectionName), error => onError('Db open error: ', error))
        .then(coll => (collection = coll) && collection.insert(doc), error => onError('Error getting collection: ', error))
        .then(result => collection.updateOne(spec, part), error => onError('Error inserting into validation collection: ', error))
        .then(result => collection.find(spec).toArray(), error => onError('Error updating in validation collection: ', error))
        .then(doc => validate(doc[0]), error => onError('Error finding updated document in validation collection: ', error))
        .then(() => collection.remove(spec))
        .then(result => isValid)
        .catch(error => onError('', error));

    //Validate document
    function validate(doc) {
        isValid = validator.validate(schema, doc);
    }
}
