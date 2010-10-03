/* 
    util.js
    mongodb-rest

    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 
var mongo = require("mongodb"),
    config = module.parent.parent.exports.config;

/*
 * flavorize - Changes JSON based on flavor in configuration 
 */
module.exports.flavorize = function(doc, direction) {
  if (direction == "in") {
    if (config.flavor == "sproutcore") {
      delete doc['guid']; // only do this in case flavor is set to sproutcore
    }
  } else {
    if (config.flavor == "regular") {
      doc._id = doc._id.toHexString();
    } else {
      var guid = doc._id.toHexString();
      delete doc['_id'];
      doc.guid = guid;
    }
  }
  return doc;
};