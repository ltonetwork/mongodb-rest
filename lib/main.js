var mongo = require("mongodb");

module.exports = function (app, config) {

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
};