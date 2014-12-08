var querystring = require('querystring');
var uuid = require('node-uuid');
var mongo = require('promised-mongo');

var DEFAULT_TOKEN_EXPIRATION_TIME_HOURS = 8;

module.exports = function(app, config) {
    // Don't bother setting up auth if we don't have the necessary config
    if( config.auth.usersDBConnection == undefined || config.auth.tokenDBConnection == undefined ) {
        return;
    }

    var tokenExpirationTimeHours = config.auth.tokenExpirationTimeHours || DEFAULT_TOKEN_EXPIRATION_TIME_HOURS;

    var usersCollection = mongo(config.auth.usersDBConnection, ['users', ]).users;    
    var tokensCollection = mongo(config.auth.tokenDBConnection, ['tokens', ]).tokens;
    
    
    app.use( function(req, res, next) {
        req.path = req.path.slice( 4 );

        // If this is a login request, let them through
        if( req.path == '/login' ) {
            return next();
        }

        var pathSplit = req.path.split('/');

        if( pathSplit[0] == '' ) {
            pathSplit.shift();
        }

        var db = pathSplit[0],
            collection = pathSplit[1];

        if( req.query.token == undefined ) {
            return res.status(401).json( {error: 'Unauthorized - no token'} );
        } 
        else {
            // If the given token is universal auth token, let the request through
            if( config.auth.universalAuthToken !== undefined && 
                req.query.token == config.auth.universalAuthToken ) {
                return next();
            }            

            tokensCollection.findOne({token: req.query.token}, function(err, token) {
                if( token ) {
                    var expirationDate = new Date(token.created);
                    expirationDate.setHours( expirationDate.getHours() + tokenExpirationTimeHours );

                    if( expirationDate > new Date() ) {
                        next();
                    } 
                    else {
                        token.remove();
                        next();
                    }
                } 
                else {
                    return res.status(401).json( {error: 'Unauthorized - no matching token found'} );
                }                
            });            
        }
    });

    app.use( '/login', function(req, res) {
        usersCollection.findOne({email: req.body.email}, function(err, user) {
            if( !user ) {
                return res.status(404).json({message: 'User not found with email ' + req.body.email})
            } 
            else if( user.password != req.body.password ) {
                return res.status(401).json({message: 'Incorrect password for user with email ' + req.body.email})
            }

            tokensCollection.findOne({userId: user._id}, function(err, token) {
                if( token ) {
                    var expirationDate = new Date( token.created );
                    expirationDate.setHours( expirationDate.getHours() + tokenExpirationTimeHours );
                    
                    // If this token was created before 8 hours ago, it's a legit token
                    if( expirationDate > new Date() ) {
                        return res.status(200).json({token: token.token, created: token.created})
                    } 
                    else {
                        // This token is too old, so destroy it
                        token.remove();
                    }
                }

                var newToken = {
                    userId: user._id,
                    token: uuid.v1(),
                    created: new Date(),
                };

                tokensCollection.save(newToken, function(err, token) {
                    res.status(200).json({token: newToken.token, created: newToken.created})
                });
            });         
        });
    });

}