/**
 * Create id for mongo queries
 */

const mongodb = require("mongodb");
const BSON = mongodb.BSONPure;

module.exports = castId;

function castId(id) {
    const isMongoId = id.toString().match(/^[0-9a-fA-F]{24}$/);

    return isMongoId ? new BSON.ObjectID(id) : id;
}
