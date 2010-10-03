var mongo = require("mongodb"),
    app = module.parent.exports.app,
    config = module.parent.exports.config;

app.get('/:command', function(req, res) {
  res.send(501); 
});
