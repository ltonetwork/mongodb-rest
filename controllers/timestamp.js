var sys = require("sys");

exports.register = function(app) {

  // GET server timestamp
  app.get('/timestamp', function(req, res, next) {
    var date = new Date();
    var response = {minutes : date.getMinutes(), hour : date.getHours(), day : date.getDate(), month : date.getMonth(), year : date.getFullYear(), sinceEpoch : date.getTime()};
    app.renderResponse(res, null, response);      
  });
      
};
