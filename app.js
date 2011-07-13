
/**
 * Module dependencies.
 */

var fs = require("fs");
var argv = require('optimist')
           .default("config", process.cwd()+"/config.json")
           .argv;

try {
	options = JSON.parse(fs.readFileSync(argv.config));
} catch(e) {
throw new Error("could not read config "+argv.config+" internal error: "+e.toString());
}

var server = require("./server");
server.create(options).start();
