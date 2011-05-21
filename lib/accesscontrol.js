/* 
    accesscontrol.js
    mongodb-rest

    Created by Benjamin Eidelman on 2011-04-05.
		This file is part of mongodb-rest.
*/ 
var mongo = require("mongodb"),
    config = module.parent.exports.config;

/*
 * accesscontrol - handles http access control based on configuration
 */
module.exports.handle = function(req, res, next) {
	if (req.header('Origin')) {
		if (config.accessControl.allowOrigin) {
			res.header('Access-Control-Allow-Origin', config.accessControl.allowOrigin);
		}
		if (config.accessControl.allowMethods) {
			res.header('Access-Control-Allow-Methods', config.accessControl.allowMethods);
		}
		if (req.header('Access-Control-Request-Headers')) {
			res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
		}
	}
	return next();	
};
