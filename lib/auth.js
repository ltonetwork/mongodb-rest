var querystring = require('querystring');
var uuid = require('node-uuid');
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;

var DEFAULT_TOKEN_EXPIRATION_TIME_HOURS = 8;

module.exports = function(app, config) {
    // Don't bother setting up auth if we don't have the necessary config
    if( config.auth.usersDBConnection == undefined || config.auth.tokenDBConnection == undefined ) {
        return;
    }

    var usersCollectionName = 'users';
    var tokensCollectionName = 'tokens';

    var tokenExpirationTimeHours = config.auth.tokenExpirationTimeHours || DEFAULT_TOKEN_EXPIRATION_TIME_HOURS;

    app.use( function(req, res, next) {
        req.path = req.path.slice( 4 );

        // If this is a login request, let them through
        if( req.path == '/login' ) {
            return next();
        }

        var token = req.query.token;
        if(!token) {
            res.status(401).json({ error: 'Unauthorized - no token' });
            return;
        } 

        // If the given token is universal auth token, let the request through
        if (config.auth.universalAuthToken && 
            token === config.auth.universalAuthToken) {
            next();
            return;
        }            

        MongoClient.connect(config.auth.tokenDBConnection, function (err, tokensDb) {

            if (err) {
                res.status(500).json({ error: err });
                return;
            }

            tokensDb.collection(tokensCollectionName, function (err, tokensCollection) {
                if (err) {
                    tokensDb.close();
                    res.status(500).json({ error: err });
                    return;
                }

                tokensCollection.findOne({ token: token }, function (err, token) {

                    if (err) {
                        tokensDb.close();    
                        res.status(500).json({ error: err });
                        return;
                    }

                    if (!token) {
                        tokensDb.close();    
                        res.status(401).json( {error: 'Unauthorized - no matching token found'} );
                        return;
                    }                

                    var expirationDate = new Date(token.created);
                    expirationDate.setHours( expirationDate.getHours() + tokenExpirationTimeHours );

                    if( expirationDate <= new Date() ) {
                        tokensCollection.remove({ _id: token._id });
                    }

                    tokensDb.close();

                    next();
                });
            });
        });
    });

    app.use( '/login', function(req, res) {

        var username = req.body.username;
        var password = req.body.password;

        if (!username) {
            res.status(400).json({ message: '"username" not specified in request body.'});
            return;
        }

        if (!password) {
            res.status(400).json({ message: '"password" not specified in request body.'});
            return;
        }

        MongoClient.connect(config.auth.usersDBConnection, function (err, usersDb) {

            if (err) {
                res.status(500).json({ error: err });
                return;
            }

            usersDb.collection(usersCollectionName, function (err, usersCollection) {

                if (err) {
                    usersDb.close();
                    res.status(500).json({ error: err });
                    return;
                }

                usersCollection.findOne({ username: username }, function (err, user) {
                    usersDb.close();

                    if (err) {
                        res.status(500).json({ error: err });
                        return;
                    }
                    else if (!user) {
                        res.status(404).json({message: 'User not found with username ' + username});
                        return;
                    } 
                    else if( user.password !== password ) {
                        res.status(401).json({ message: 'Incorrect password for user with username ' + username });
                        return;
                    }

                    MongoClient.connect(config.auth.tokenDBConnection, function (err, tokensDb) {

                        if (err) {
                            es.status(500).json({ error: err });
                            return;
                        }

                        tokensDb.collection(tokensCollectionName, function (err, tokensCollection) {
                            if (err) {
                                tokensDb.close();
                                res.status(500).json({ error: err });
                                return;
                            }

                            tokensCollection.findOne({ userId: user._id}, function (err, token) {
                                if (err) {
                                    tokensDb.close();
                                    res.status(500).json({ error: err });
                                    return;
                                }

                                if (token) {
                                    var expirationDate = new Date( token.created );
                                    expirationDate.setHours( expirationDate.getHours() + tokenExpirationTimeHours );
                                    
                                    // If this token has not expired, it's a legit token
                                    if( expirationDate > new Date() ) {
                                        tokensDb.close();
                                        res.status(200).json({token: token.token, created: token.created});
                                        return;
                                    } 
                                    else {
                                        // This token is too old, so destroy it
                                        tokensCollection.remove({ _id: token._id });
                                    }
                                }

                                var newToken = {
                                    userId: user._id,
                                    token: uuid.v1(),
                                    created: new Date(),
                                };

                                tokensCollection.save(newToken,  function (err) {
                                    tokensDb.close();

                                    if (err) {
                                        res.status(500).json({ error: err });
                                        return;
                                    }

                                    res.status(200).json({ 
                                        token: newToken.token, 
                                        created: newToken.created
                                    });
                                });
                            });
                        });
                    });
                });

            });
        });
    });
};