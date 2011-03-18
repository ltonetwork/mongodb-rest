var sys = require("sys");
var ObjectID = require("mongodb/lib/mongodb/bson/bson").ObjectID;

var decodeIfNested = function(path, value, data) {
	if(path.length > 1) {
		data = data[path[0]] = {};
		path.shift();
		decodeIfNested(path, value, data);
	} else
		data[path[0]] = decodeField(value);
};

var isValidDate = function(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" )
    return false;
  return !isNaN(new Date(d).getTime());
}

var decodeField = function(value) {
  if(isValidDate(value))
     return new Date(value);
  return value;
}

exports.put = function(req, res, spec, data) {
    if(/^[0-9a-fA-F]{24}$/.test(req.params.id))
	    spec['_id'] = new ObjectID(req.params.id);
	else
	    spec['_id'] = req.params.id;
	    
	data.$set = {};
	data = data.$set;
	for(var i in req.body.data)
			if(i != '_id') // protect _id
				if(i.indexOf(".") == -1)
					data[i] = decodeField(req.body.data[i]);
				else
					decodeIfNested(i.split("."), req.body.data[i], data);
};

exports.post = function(req, res, data) {
	for(var i in req.body.data)
			if(i.indexOf(".") == -1)
				data[i] = decodeField(req.body.data[i]);
			else
				decodeIfNested(i.split("."), req.body.data[i], data);
};

exports.del = function(req, res, spec) {
	if(/^[0-9a-fA-F]{24}$/.test(req.params.id))
	    spec['_id'] = new ObjectID(req.params.id);
	else
	    spec['_id'] = req.params.id;
}
