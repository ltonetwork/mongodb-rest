/**
 * Create id for mongo queries
 */

const ObjectID = require('mongodb').ObjectID;

module.exports = castId;

function castId(id) {
    const isMongoId = id.toString().match(/^[0-9a-fA-F]{24}$/);

    return isMongoId ? new ObjectID(id) : id;
}
