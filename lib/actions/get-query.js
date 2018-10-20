/**
 * Route action for performing GET query
 */

const connection = require('../helpers/connection');
const castId = require('../helpers/cast-id');
const onError = require('../helpers/pass-error');
const transformCollection = require('../helpers/transform-collection');

module.exports = getQuery;

function getQuery(request, response, config) {
    const logger = config.logger;
    const collectionOutputType = config.collectionOutputType || 'json';

    const query = buildQuery(request);
    const options = buildQueryOptions(request);

    connection.connectPromise(request.dbUri)
        .then(db => db.collection(request.params.collection), error => onError('Db open error: ', error))
        .then(collection => collection.find(query), error => onError('Error getting collection: ', error))
        .then(cursor => applyOptions(cursor), error => onError('Error finding document(s): ', error))
        .then(docs => processDocs(docs), error => onError('Error finding document(s): ', error))
        .catch(error => response.onError('', error));

    //Apply query options
    function applyOptions(cursor) {
        const o = options;

        if (o.sort) cursor.sort(o.sort);
        if (o.hint) cursor.hint(o.hint);
        if (o.snapshot) cursor.snapshot(!!o.snapshot);

        if (o.limit) cursor.limit(parseInt(o.limit));
        if (o.skip) cursor.skip(parseInt(o.skip));
        if (o.fields) cursor.project(o.fields);

        if (o.count) return cursor.count(true);

        return o.explain ?
            cursor.explain() :
            cursor.toArray();
    }

    //Process fetched documents
    function processDocs(docs) {
        //Result of explain query
        if (typeof docs.queryPlanner !== 'undefined') {
            return response.json(docs);
        }

        //Result of count operation
        if (Number.isInteger(docs)) {
            return response.json({count: docs});
        }

        var result = [];

        if (request.params.id) {
            if (docs.length > 0) {
                result = docs[0];
                response.json(result);
            } else {
                response.status(404).json({ ok: 0 });
            }
        } else {
            docs.forEach(function(doc) {
                result.push(doc);
            });

            const outputType = request.query.output || collectionOutputType;
            result = transformCollection(config, outputType, result);
            response[outputType](result);
        }
    }

    //Build query object
    function buildQuery(request) {
        var query = request.query.query ? JSON.parse(request.query.query) : {};

        //Providing an id overwrites giving a query in the URL
        if (request.params.id) {
            query = {'_id': castId(request.params.id)};
        } else if (query._id) {
            query = {'_id': castId(query._id)};
        } else if (testForNested(query)){
            normalizeNestedQuery(query);
        }

        return query;
    }

    //Build query options object
    function buildQueryOptions(request) {
        const options = request.params.options || {};
        const names = ['limit','sort','fields','skip','hint','explain','snapshot','count'];
        const needParse = ['fields','hint','sort'];

        for (o in request.query) {
            if (names.indexOf(o) >= 0) {
                if (needParse.indexOf(o) >= 0) {
                    options[o] = JSON.parse(request.query[o]);
                } else {
                    options[o] = request.query[o];
                }
            }
        }

        return options;
    }

    //Function to test whether object has nested objects
    function testForNested(obj) {
        const query = obj;

        for (var i = 0; i < Object.keys(query).length; i++) {
            if (typeof(obj[Object.keys(obj)[i]]) == 'object'){
                return true;
            }
        }

        return false;
    }

    //Recursively build a query from object of conditions
    function normalizeNestedQuery(obj) {
        const idNames = ['_id', '$id', "$oid"];

        for (var key in obj) {
            //Found nested object - going deeper
            if (typeof obj[key] === 'object') {
                obj[key] = searchObj( obj[key] );
            }

            //Found a match
            if (idNames.indexOf(key) > -1) {
                //Cast the id to an Object id
                return obj = castId(obj[key]);
            } else if (key=="$regex"){
                var regExpString = obj[key].substring(obj[key].indexOf('/')+1, obj[key].lastIndexOf('/'));
                var regExpFlags = obj[key].substring(obj[key].lastIndexOf('/')+1)

                return obj = {"$regex": new RegExp(regExpString, regExpFlags)};
            } else {
                return obj;
            }
        }
    }
}
