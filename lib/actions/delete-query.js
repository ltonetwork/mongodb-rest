/**
 * Route action for deleting db records
 */

const connection = require('../connection');
const mongodb = require("mongodb");
const BSON = mongodb.BSONPure;

module.exports = deleteQuery;

function deleteQuery(request, response, tools) {
    const logger = tools.logger;
    const spec = {'_id': new BSON.ObjectID(request.params.id)};

    connection.connect(tools.dbConfig.baseUri + '/' + request.params.db, function (err, db) {

        if (err) {
            logger.error('Db open error: ' + err.message);
            response.status(500).json({ message: 'Server error' });
            return;
        }

        db.collection(request.params.collection, function(err, collection) {
            if (err) {
                logger.error('Error getting collection ' + collection + ': ' + err.message);
                response.status(500).json({ message: 'Server error' });
                return;
            }

            collection.remove(spec, function(err, docs) {
                if (err) {
                    logger.error('Error removing from ' + collection + ': ' + err.message);
                    response.status(500).json({ message: 'Server error' });
                    return;
                }

                response.json({ ok: 1 });
            });
        });
    });
}
