var server = require('../server'),
    assert = require('assert');
    app = server.app;

server.config.flavor = "regular";

module.exports = {
'Delete a Document': function(){
    
    // First create the document
    assert.response(app, {
      url: '/tests/tests',
      method: 'POST',
      data: '{"test":"update"}',
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
            "test":"update",
            "_id":objectId
          }
        );
        assert.equal(res.statusCode, 200);

        // Delete it
        assert.response(app, {
          url: '/tests/tests/'+objectId,
          method: 'DELETE',
        }, function(res) {
          assert.equal(res.body, '{"ok":1}');
          assert.equal(res.statusCode, 200);

          // Check whether we can still query the delete document.
          assert.response(app, {
            url: '/tests/tests/'+objectId,
            method: 'GET',
          }, function(res) {
            assert.equal(res.statusCode, 404);
          });
        });
      });
    });
  }
};
