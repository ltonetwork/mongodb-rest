/**
 * Route action for performing GET query
 */

const connection = require('../connection');
const mongodb = require("mongodb");
const BSON = mongodb.BSONPure;

module.exports = getQuery;

function getQuery(request, response, tools) {
    const logger = tools.logger;
    const collectionOutputType = tools.config.collectionOutputType || 'json';

    const query = buildQuery(request);
    const options = buildQueryOptions(request);

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

            collection.find(query, options, function(err, cursor) {
                if (err) {
                    logger.error('Error finding document(s): ' + err.message);
                    response.status(500).json({ message: 'Server error' });
                    return;
                }

                cursor.toArray(function(err, docs){
                    if (err) {
                        logger.error('Error getting database cursor as array: ' + err.message);
                        response.status(500).json({ message: 'Server error' });
                        return;
                    }

                    var result = [];
                    if(request.params.id) {
                        if(docs.length > 0) {
                            result = docs[0];
                            response.json(result);
                        } else {
                            response.status(404).json({ ok: 0 });
                        }
                    } else {
                        docs.forEach(function(doc) {
                            result.push(doc);
                        });

                        var outputType = request.query.output || collectionOutputType;
                        result = tools.utils.transformCollection(outputType, result);
                        response[outputType](result);
                    }
                });
            });
        });

    });

    //Build query object
    function buildQuery(request) {
        var query = request.query.query ? JSON.parse(request.query.query) : {};

        //Providing an id overwrites giving a query in the URL
        if (request.params.id) {
            query = {'_id': new BSON.ObjectID(request.params.id)};
        } else if (testForNested(query)){
            normalizeNestedQuery(query);
        }

        return query;
    }

    //Build query options object
    function buildQueryOptions(request) {
        const options = request.params.options || {};
        const names = ['limit','sort','fields','skip','hint','explain','snapshot','timeout'];
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
                return obj = new BSON.ObjectID.createFromHexString(obj[key]);
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
