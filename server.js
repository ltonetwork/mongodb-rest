var fs = require('fs');
var mongodb_rest = require('./lib/mongodb_rest');

fs.readFile('./settings.json', function(err, data) {
    var settings, custom_settings;
    if (err) {
        sys.puts('No settings.json found. Using default settings');
        mongodb_rest.start(mongodb_rest.default_settings);
        process.exit(0);
    }
    try {
        custom_settings = JSON.parse(data);
    } catch (e) {
        sys.puts('Error parsing settings.json');
        process.exit(1);
    }
    settings = custom_settings || mongodb_rest.default_settings;
    mongodb_rest.start(settings);
});