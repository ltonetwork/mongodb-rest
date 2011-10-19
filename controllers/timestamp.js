var sys = require("sys");

exports.register = function(app) {

  // GET server timestamp
  app.get('/timestamp', function(req, res, next) {
    var date = new Date();
    // month is returned as 0-11 by JS, but by 1-12 by our API
    // hour is returned as 0-23 by both JS and our API
    var response = {minutes : date.getMinutes(), hour : date.getHours(), day : date.getDate(), month : (date.getMonth()+1), year : date.getFullYear(), sinceEpoch : date.getTime()};
    app.renderJsonpResponse(res, null, response);
  });
      
};
