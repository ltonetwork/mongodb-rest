/**
 * Route action for getting all collection names from given db
 */

const connection = require('../connection');

module.exports = getCollectionsNames;

function getCollectionsNames(request, response, tools) {
    connection.connect(tools.dbConfig.baseUri + '/' + request.params.db, function (err, db) {
        if (err) {
            tools.logger.error('Db open error: ' + err.message);
            response.status(500).json({ message: 'Server error' });
            return;
        }

        db.collectionNames(function (err, collections) {
            if (err) {
                tools.logger.error('Error getting collection names: ' + err.message);
                response.status(500).json({ message: 'Server error' });
                return;
            }

            // Pull out the name of the collection and chop off the database name.
            const collectionNames = collections.map(function (collection) {
                return collection.name.substring(request.params.db.length + 1);
            });

            response.json(collectionNames);
        });
    });
}
