/**
 * Route action for performing multiple operations in single query (insert, update and delete)
 */

const util = require('util');
const connection = require('../helpers/connection');
const castId = require('../helpers/cast-id');
const mongodb = require('mongodb');
const BSON = mongodb.BSONPure;

module.exports = postBulk;

function postBulk(request, response, tools) {
    const logger = tools.logger;
    const dbUri = tools.dbConfig.baseUri + '/' + request.params.db;

    if(!request.body) {
        response.json([]);
        return;
    }

    connection.connectPromise(dbUri)
        .then(db => doBulkWrite(db), error => onError('Db open error', error))
        .then(() => onDone(), error => onError('Error performing bulk operation: ', error));

    //Bulk write to all given collections
    function doBulkWrite(db) {
        const data = request.body.data;
        const bulkPromises = [];

        for (var collectionName in data) {
            var promise = getBulkWritePromise(db, collectionName, data);
            bulkPromises.push(promise);
        }

        return Promise.all(bulkPromises);
    }

    //Get promise for working with collection
    function getBulkWritePromise(db, collectionName, data) {
        return connection
            .getCollection(db, collectionName)
            .then(collection => doBulkWriteCollection(collection, data[collectionName]));
    }

    //Bulk write to single given collection
    function doBulkWriteCollection(collection, data) {
        return new Promise(function (resolve, reject) {
            const batch = collection.initializeOrderedBulkOp();

            addInserts(batch, data);
            addUpdates(batch, data);
            addDeletes(batch, data);

            batch.execute(function(error, result) {
                error ? reject(error) : resolve();
            });
        });
    }

    //Add insert operations to batch
    function addInserts(batch, data) {
        if (typeof data.insert === 'undefined') return;

        for (var i = 0; i < data.insert.length; i++) {
            var doc = data.insert[i];

            if (typeof doc._id !== 'undefined') {
                doc._id = castId(doc._id);
            }

            batch.insert(doc);
        }
    }

    //Add update operations to batch
    function addUpdates(batch, data) {
        if (typeof data.update === 'undefined') return;

        for (var i = 0; i < data.update.length; i++) {
            var doc = data.update[i];
            var id = castId(doc._id);

            delete doc._id;

            batch.find({_id: id}).updateOne({$set: doc});
        }
    }

    //Add delete operations to batch
    function addDeletes(batch, data) {
        if (typeof data.delete === 'undefined') return;

        for (var i = 0; i < data.delete.length; i++) {
            var doc = data.delete[i];

            if (typeof doc._id !== 'undefined') {
                doc._id = castId(doc._id);
            }

            batch.find(doc).remove(doc);
        }
    }

    //Perform some final actions
    function onDone() {
        response.status(200).json({ ok: 1 });
    }

    //Error callback
    function onError(prefix, error) {
        logger.error(prefix + error.message);
        response.status(500).json({ message: 'Server error' });
    }
}
