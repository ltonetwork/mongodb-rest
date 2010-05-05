Name
----

mongodb-rest - REST server for MongoDB

Description
-----------

This is a REST server for MongoDB using Node, using the native node.js MongoDB driver.

This project now includes unit tests in the unit folder.

Notes
-----

Supported REST requests:

* GET /db/collection - Returns all documents
* GET /db/collection?query=%7B%22isDone%22%3A%20false%7D - Returns all documents satisfying query
* GET /db/collection?query=%7B%22isDone%22%3A%20false%7D&limit=2&skip=2 - Ability to add options to query (limit, skip, etc)
* GET /db/collection/id - Returns document with _id_
* POST /db/collection - Insert new document in collection (document in POST body)
* PUT /db/collection/id - Update document with _id_ (updated document in PUT body)
* DELETE /db/collection/id - Delete document with _id_

Flavors:

* Setup "sproutcore" as flavor, it will then change _id as returned by MongoDB into guid, as used by SproutCore. I'm not sure whether this will eventually be useful, though it does allow for simpler DataSources.

Todo
----

* REST - PUT /db/collection - Update collection with changes in PUT body
* Other useful commands (quit, reconnect, addUser, removeUser, etc)
* Error handling - It's fairly limited at the moment

Credits
-------

* MongoDB Driver: http://github.com/christkv/node-mongodb-native
* Testing framework: http://github.com/bentomas/node-async-testing