var sys = require("sys");
exports.query = function(req, res, err, docs, allCount) {
	if(err == null) {
		res.header('Content-Type', 'application/json');
	    res.send({allCount: allCount, data: docs, success: true});
	} else {
		sys.log(sys.inspect(err));
		res.send({success: false, error:err.message}, 200);
	}
};

exports.post = function(req, res, err, docs) {
	if(err == null) {
	    res.header('Content-Type', 'application/json');
	    res.send({success: true, data: docs}, 200);
	} else {
		sys.log(sys.inspect(err));
		res.send({success: false, error:err.message}, 200);
	}
};

exports.put = function(req, res, err, doc) {
	if(err == null) {
		res.header('Content-Type', 'application/json');
        res.send({success: true, data: doc}, 200);
	} else {
		sys.log(sys.inspect(err));
		res.send({success: false, error:err.message}, 200);
	}
};

exports.del = function(req, res, err, doc) {
	if(err == null) {
		res.header('Content-Type', 'application/json');
        res.send({success: true, data: doc}, 200);
	} else {
		sys.log(sys.inspect(err));
		res.send({success: false, error:err.message}, 200);
	}
};