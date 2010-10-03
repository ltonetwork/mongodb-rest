var mongo = require("mongodb"),
    app = module.parent.exports.app,
    config = module.parent.exports.config,
    util = require("./util");

app.get('/', function(req, res){
  if(config.debug == true) {
    res.render('index', {
      locals: {
        config: config,
      }
    });
  } else {
    res.send();
  }
});
