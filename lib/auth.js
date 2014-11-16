var querystring = require('querystring'),
    mongoose = require('mongoose'),
    uuid = require('node-uuid');

var DEFAULT_TOKEN_EXPIRATION_TIME_HOURS = 8;

module.exports = function(app, config) {
    // Don't bother setting up auth if we don't have the necessary config
    if( config.auth.usersDBConnection == undefined || config.auth.tokenDBConnection == undefined ) {
        return;
    }

    config.auth.tokenExpirationTimeHours == config.auth.tokenExpirationTimeHours || DEFAULT_TOKEN_EXPIRATION_TIME_HOURS;

    var usersDBConnection = mongoose.createConnection( config.auth.usersDBConnection ),
        tokenDBConnection = mongoose.createConnection( config.auth.tokenDBConnection );
    
    var UserSchema = mongoose.Schema({
        name: String,
        password: String,
    });

    var TokenSchema = mongoose.Schema({
        userId: String,
        token: String,
        created: Date,
    });

    var User = usersDBConnection.model( 'User', UserSchema );
    var Token = tokenDBConnection.model( 'Token', TokenSchema );
    
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
        } else {
            // If the given token is universal auth token, let the request through
            if( config.auth.universalAuthToken !== undefined && 
                req.query.token == config.auth.universalAuthToken ) {
                return next();
            }            

            Token.findOne({token: req.query.token}, function(err, token) {
                if( token ) {
                    var createdDateCopy = new Date(token.created);
                    createdDateCopy.setHours( createdDateCopy.getHours() + config.auth.tokenExpirationTimeHours );

                    if( createdDateCopy > new Date() ) {
                        next();
                    } else {
                        var newToken = new Token({
                            userId: token.userId,
                            token: uuid.v1(),
                            created: new Date(),
                        });

                        token.remove();
                        next();
                    }
                } else {
                    return res.status(401).json( {error: 'Unauthorized - no matching token found'} );
                }                
            });            
        }
    });

    app.use( '/login', function(req, res) {
        User.findOne({email: req.body.email}, function(err, user) {
            if( !user ) {
                return res.status(404).json({message: 'User not found with email ' + req.body.email})
            } else if( user.password != req.body.password ) {
                return res.status(401).json({message: 'Incorrect password for user with email ' + req.body.email})
            }

            Token.findOne({userId: user._id}, function(err, token) {
                if( token ) {
                    var createdDateCopy = new Date( token.created );
                    createdDateCopy.setHours( createdDateCopy.getHours() + 8 );
                    
                    // If this token was created before 8 hours ago, it's a legit token
                    if( createdDateCopy > new Date() ) {
                        return res.status(200).json({token: token.token, created: token.created})
                    } else {
                        // This token is too old, so destroy it
                        token.remove();
                    }
                }

                var newToken = new Token({
                    userId: user._id,
                    token: uuid.v1(),
                    created: new Date(),
                });

                newToken.save( function(err, token) {
                    res.status(200).json({token: newToken.token, created: newToken.created})
                });
            });         
        });
    });

}