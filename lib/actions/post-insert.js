/**
 * Route action for getting all databases names
 */

const connection = require('../connection');

module.exports = postInsert;

function postInsert(request, response, tools) {
    const logger = tools.logger;

    if(!request.body) {
        response.json({ ok: 1 });
        return;
    }

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

            // We only support inserting one document at a time
            collection.insert(
                Array.isArray(request.body) ? request.body[0] : request.body,
                function(err, docs) {
                    if (err) {
                        logger.error('Error inserting into collection ' + collection + ': ' + err.message);
                        response.status(500).json({ message: 'Server error' });
                        return;
                    }

                    const location = '/' + request.params.db + '/' + request.params.collection + '/' + docs[0]._id.toHexString();

                    response.header('Location', location);
                    response.status(201).json({ ok: 1 });
                }
            );
        });
    });
}
