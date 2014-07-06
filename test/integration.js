'use strict';

//
// Integration tests for mongodb-rest.
//

var mongojs = require('mongojs');
var testDbName = 'mongodb_rest_test'
var db = mongojs(testDbName);
var async = require('async');

var loadFixture = function (data, done) {    
    db.dropDatabase(function (err) {
        if (err) {
            throw err;
        }
        db.createCollection(testDbName, function (err, collection) {
            if (err) {
                throw err;
            }

            async.each(data, 
                // Single async operation.
                function (item, callback) {
                    collection.save(item, callback);
                }, 
                // Callback after all items saved.
                function (err) {                    
                    db.close();
                    done();
                }
            );
        });
    });
};

loadFixture([{
    "answer": 42
}], function () {
    console.log('done!');
});

