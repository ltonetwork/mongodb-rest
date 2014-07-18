var mongo = require("mongodb"),
    config = module.parent.exports.config,
    util = require("./util");
	
app.get('/info', function(req, res){
    if(config.debug == true) {
        res.render('index', {
            config: config
        });
    } else {
        res.send();
    }
});
