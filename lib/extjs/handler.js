var sys = require("sys");
var mongo = require("mongodb");

var decodeIfNested = function(path, value, data) {
	if(path.length > 1) {
		data = data[path[0]] = {};
		path.shift();
		decodeIfNested(path, value, data);
	} else
		data[path[0]] = value;
};

exports.put = function(req, res, spec, data) {
	spec['_id'] = req.params.id;
	data.$set = {};
	data = data.$set;
	for(var i in req.body.data)
			if(i != '_id') // protect _id
				if(i.indexOf(".") == -1)
					data[i] = req.body.data[i];
				else
					decodeIfNested(i.split("."), req.body.data[i], data);
};

exports.post = function(req, res, data) {
	for(var i in req.body.data)
			if(i.indexOf(".") == -1)
				data[i] = req.body.data[i];
			else
				decodeIfNested(i.split("."), req.body.data[i], data);
};

exports.del = function(req, res, spec) {
	spec['_id'] = req.params.id;
}