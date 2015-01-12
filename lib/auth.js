var querystring = require('querystring');
var uuid = require('node-uuid');
var mongodb = require("mongodb");
var connection = require('./connection');

var DEFAULT_TOKEN_EXPIRATION_TIME_HOURS = 8;

module.exports = function(app, config) {

    if (!config.auth) {
        // Authentication is not enabled.
        return;
    }

    if (!config.auth.usersDBConnection) {
        throw new Error("Authentication has been enabled by including 'auth' in the configuration, but users database connection string 'usersDBConnection' has not been specified.");
    }

    if (!config.auth.tokenDBConnection) {
        throw new Error("Authentication has been enabled by including 'auth' in the configuration, but tokens database connection string 'tokenDBConnection' has not been specified.");
    }

    var logger = config.logger;
    var usersCollectionName = config.auth.usersCollection || 'users';
    var tokensCollectionName = config.auth.tokensCollection || 'tokens';
    var tokenExpirationTimeHours = config.auth.tokenExpirationTimeHours || DEFAULT_TOKEN_EXPIRATION_TIME_HOURS;

    app.use(function(req, res, next) {
        req.path = req.path.slice( 4 );

        // If this is a login request, let them through
        if (req.path == '/login') {
            return next();
        }

        var token = req.query.token;
        if(!token) {
            logger.warning('Unauthorized access - no token supplied');
            res.status(401).json({ error: 'Unauthorized access - no token supplied' });
            return;
        } 

        // If the given token is universal auth token, let the request through
        if (config.auth.universalAuthToken && 
            token === config.auth.universalAuthToken) {
            logger.verbose('Access authorized by use of universal auth token');
            next();
            return;
        }            

        connection.connect(config.auth.tokenDBConnection, function (err, tokensDb) {

            if (err) {
                logger.error('Failed to connect to database ' + config.auth.tokenDBConnection + ': ' + err.message);
                res.status(500).json({ error: err });
                return;
            }

            tokensDb.collection(tokensCollectionName, function (err, tokensCollection) {
                if (err) {
                    logger.error('Error getting collection ' + tokensCollectionName + ': ' + err.message);
                    res.status(500).json({ error: err });
                    return;
                }

                tokensCollection.findOne({ token: token }, function (err, token) {

                    if (err) {
                        logger.error('Error finding token ' + token + ' in database: ' + err.message);
                        res.status(500).json({ error: err });
                        return;
                    }

                    if (!token) {
                        logger.warning('Unauthorized access - token ' + token + ' not found in database');
                        res.status(401).json( {error: 'Unauthorized - no matching token found'} );
                        return;
                    }                

                    var expirationDate = new Date(token.created);
                    expirationDate.setHours( expirationDate.getHours() + tokenExpirationTimeHours );

                    if( expirationDate <= new Date() ) {
                        logger.verbose('Token has ' + token + ' expired allowing access this time but removing token');

                        tokensCollection.remove({ _id: token._id });
                    }

                    next();
                });
            });
        });
    });

    app.use('/login', function(req, res) {

        var username = req.body.username;
        var password = req.body.password;

        if (!username) {
            var msg = '"username" not specified in request body.';
            logger.warning(msg);
            res.status(400).json({ message: msg });
            return;
        }

        if (!password) {
            var msg = '"password" not specified in request body.';
            logger.warning('Request error: ' + msg);
            res.status(400).json({ message: msg });
            return;
        }

        connection.connect(config.auth.usersDBConnection, function (err, usersDb) {

            if (err) {
                logger.error('Failed to connect to database ' + config.auth.usersDBConnection + ': ' + err.message);
                res.status(500).json({ message: 'Server error' });
                return;
            }

            usersDb.collection(usersCollectionName, function (err, usersCollection) {

                if (err) {
                    logger.error('Failed to get collection ' + usersCollectionName + ': ' + err.message);
                    res.status(500).json({ message: 'Server error' });
                    return;
                }

                usersCollection.findOne({ username: username }, function (err, user) {
                    if (err) {
                        logger.error('Error finding user ' + username + ': ' + err.message);
                        res.status(500).json({ message: 'Server error' });
                        return;
                    }
                    else if (!user) {
                        logger.warning('User ' + username + ' not found');
                        res.status(401).json({ message: 'User or password is invalid' } );
                        return;
                    } 
                    else if( user.password !== password ) {
                        logger.warning('Incorrect password for user ' + username);
                        res.status(401).json({ message: 'User or password is invalid' } );
                        return;
                    }

                    connection.connect(config.auth.tokenDBConnection, function (err, tokensDb) {

                        if (err) {
                            logger.error('Failed to connect to database ' + config.auth.tokenDBConnection + ': ' + err.message);
                            es.status(500).json({ message: 'Server error' });
                            return;
                        }

                        tokensDb.collection(tokensCollectionName, function (err, tokensCollection) {
                            
                            if (err) {
                                logger.error('Failed to get collection ' + tokensCollectionName + ': ' + err.message);
                                res.status(500).json({ message: 'Server error' });
                                return;
                            }

                            tokensCollection.findOne({ userId: user._id }, function (err, token) {
                                
                                if (err) {
                                    logger.error('Error finding token for user ' + user._id + ': ' + err.message);
                                    res.status(500).json({ message: 'Server error' });
                                    return;
                                }

                                if (token) {

                                    var expirationDate = new Date(token.created);
                                    expirationDate.setHours(expirationDate.getHours() + tokenExpirationTimeHours);

                                    // If this token has not expired, it's a legit token
                                    if (expirationDate > new Date() ) {
                                        logger.verbose('Have valid token ' + token.token + ' for user ' + user._id);

                                        res.status(200).json({ 
                                            token: token.token, 
                                            created: token.created
                                        });
                                        return;
                                    } 
                                    else {
                                        logger.verbose('Expiring token ' + token.token + ' for user ' + user._id);

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
                                    if (err) {
                                        logger.error('Failed to save new token ' + newToken.token + ' for user ' + user._id + ' to database: ' + err.message);
                                        res.status(500).json({ message: 'Server error' });
                                        return;
                                    }

                                    logger.verbose('Created new token ' + newToken.token + ' for user ' + user._id);

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