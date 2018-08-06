/**
 * Route action for getting all databases names
 */

const connection = require('../helpers/connection');
const endpoint = require('../helpers/endpoint');

module.exports = getDbNames;

function getDbNames(request, response, tools) {
    if (endpoint.isDbEndpoint(tools.config)) {
        response.json([]);
        return;
    }

    connection.connect(tools.dbConfig.baseUri, function(err, db) {
        if (err) {
            tools.logger.error('Db open error: ' + err.message);
            response.status(500).json({ message: 'Server error' });
            return;
        }

        // Use the admin database for the operation
        const adminDb = db.admin();

        // List all the available databases
        adminDb.listDatabases(function(err, dbs) {
            if (err) {
                tools.logger.error('Error listing database: ' + err.message);
                response.status(500).json({ message: 'Server error' });
                return;
            }

            const dbNames = dbs.databases.map(function (db) {
                return db.name;
            });

            response.json(dbNames);
        });
    });
}
