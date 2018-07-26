/* 
    accesscontrol.js
    mongodb-rest

	Maintained by Ashley Davis 2014-07-02
    Created by Benjamin Eidelman on 2011-04-05.
	This file is part of mongodb-rest.
*/ 
var mongo = require("mongodb");

module.exports = function (config) {
	return {
		/*
		 * accesscontrol - handles http access control based on configuration
		 */
		handle: function(req, res, next) {
			if (req.header('Origin')) {
				
				if (config.accessControl.allowOrigin) {
					res.header('Access-Control-Allow-Origin', config.accessControl.allowOrigin);
				}
				
				if (config.accessControl.allowCredentials) {
					res.header('Access-Control-Allow-Credentials', config.accessControl.allowCredentials);
				}
				
				if (config.accessControl.allowMethods) {
					res.header('Access-Control-Allow-Methods', config.accessControl.allowMethods);
				}

				if (req.header('Access-Control-Request-Headers')) {
					res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
				}
			}

			return next();	
		}
	};
};
