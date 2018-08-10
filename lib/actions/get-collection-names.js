/**
 * Route action for getting all collection names from given db
 */

const connection = require('../helpers/connection');
const onError = require('../helpers/pass-error');

module.exports = getCollectionsNames;

function getCollectionsNames(request, response, config) {
    connection.connectPromise(request.dbUri)
        .then(db => db.listCollections().toArray(), error => onError('Db open error: ', error))
        .then(collections => returnList(collections), error => onError('Error getting collection names: ', error))
        .then(names => response.onDone(names))
        .catch(error => response.onError('', error));

    //Map collections to colections names
    function returnList(collections) {
        const names = collections.map(function(collection) {
            return collection.name;
        });

        return names;
    }
}
