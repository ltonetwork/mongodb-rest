var server = require('../server'),
    assert = require('assert');
    app = server.app;

module.exports = {
  'SproutCore flavor': function(){
    server.config.flavor = "sproutcore";
    
    // First create the document
    assert.response(app, {
      url: '/tests/tests',
      method: 'POST',
      data: '{"test":"sproutcore"}',
      headers: {
        'Content-Type': 'application/json'
      }
    }, 
    function(res) {
      assert.equal(res.body, '{"ok":1}');
      assert.equal(res.statusCode, 201);
      var location = res.header('Location').split('/').slice(1);

      assert.equal(location[0], 'tests');
      assert.equal(location[1], 'tests');
      assert.isNotNull(location[2]);
      assert.length(location[2], 24);
      var objectId = location[2];            

      // Check whether we can query it.
      assert.response(app, {
        url: '/tests/tests/'+objectId,
        method: 'GET',
      }, function(res) {
        assert.eql(JSON.parse(res.body), {
            "test":"sproutcore",
            "guid":objectId
          }
        );
        assert.equal(res.statusCode, 200);
      });
    });
  }
};
