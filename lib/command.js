var mongo = require("mongodb"),
    config = module.parent.exports.config;

app.get('/:command', function(req, res) {
  res.send(501); 
});
