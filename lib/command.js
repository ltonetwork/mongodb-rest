var mongo = require("mongodb");

module.exports = function (app, config) {

    app.get('/:command', function(req, res) {
      res.send(501); 
    });
}

