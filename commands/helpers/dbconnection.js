var mongo = require("mongodb");
var sys = require("sys");

exports.open = function(dbname, config, callback) {
    var target;
    
    if(Array.isArray(config)) {
        var servers = new Array();
        for(var i = 0; i<config.length; i++)
            servers.push(new mongo.Server(config[i].host, config[i].port));
        target = new mongo.ServerCluster(servers);
    } else {
        target = new mongo.Server(config.host, config.port, {'auto_reconnect':true});
    }
    
    var db = new mongo.Db(dbname, target, {native_parser:true});
    db.open(callback);
};
