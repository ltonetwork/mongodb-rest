/**
 * Route action for updating existing records in db
 */

const connection = require('../helpers/connection');
const mongodb = require("mongodb");
const BSON = mongodb.BSONPure;

module.exports = putUpdate;

function putUpdate(request, response, tools) {
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

            collection.update(spec, request.body, true, function(err, docs) {
                response.json({ ok: 1 });
            });
        });
    });
}
