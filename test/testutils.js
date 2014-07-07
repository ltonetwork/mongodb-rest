//
// Utils for testing.
//

var mongojs = require('mongojs');
var async = require('async');
var request = require('request');

module.exports = {
    //
    // Load data into a db collection.
    // 
    loadFixture: function (testDbName, testCollectionName, data, done) {    
        var db = mongojs(testDbName);

        db.dropDatabase(function (err) {

            if (err) {
                db.close();
                done(err);
                return;
            }

            db.createCollection(testCollectionName, function (err, collection) {
                if (err) {
                    db.close();
                    done(err);
                    return;
                }

                async.each(data, 
                    // Single async operation.
                    function (item, callback) {
                        collection.save(item, callback);                        
                    }, 
                    // Callback after all items saved.
                    function (err) {                    
                        db.close();
                        done(err);
                    }
                );
            });
        });
    },

    //
    // Request http document from the rest api.
    //
    request: function (url, done) {
        request(url, function (err, response, body) {
            if (err) {
                done(err);
                return;
            }

            done(null, body, response);
        });
    },

    //
    // Request JSON from the rest api.
    //
    requestJson: function (url, done) {
        request(url, function (err, response, body) {
            if (err) {
                done(err);
                return;
            }

            done(null, JSON.parse(body), response);
        });
    },
};
