Name
----

mongodb-rest2 - REST server for MongoDB

Description
-----------

This is a REST server for MongoDB using Node, using the native node.js MongoDB driver.

Major update, now using Express

Installation
------------

Installation is now via npm: `npm install mongodb-rest2`.

Notes
-----

Supported REST requests:

* `GET /db/collection` - Returns all documents
* `GET /db/collection?query=%7B%22isDone%22%3A%20false%7D` - Returns all documents satisfying query
* `GET /db/collection?query=%7B%22isDone%22%3A%20false%7D&limit=2&skip=2` - add options to query (limit, skip are supported atm)
* `GET /db/collection/id` - Returns document with _id_
* `GET /db/collection/id?deep=true` - Returns document with _id_ and fetches all its deep nested object references
* `POST /db/collection` - Insert new document in collection (document in POST body)
  * when you need to post Object Reference send it as {namespace: "collection", oid: "123dsas2sdasd"}
* `PUT /db/collection/id` - Update document with _id_ (updated document in PUT body)
  * when you need to update Object Reference send it as {namespace: "collection", oid: "123dsas2sdasd"}
  * when you send {"field.innerField":"..."} it will automaticly be converted to {field:{innerField:"..."}
* PUT /db/collection?query=%7B%22isDone%22%3A%20false%7D - update will get executed upon all documents in the collection
* `DELETE /db/collection/id` - Delete document with _id_
* `DELETE /db/collection?query=%7B%22isDone%22%3A%20false%7D` - Delete all documents matching given query

Additions:
* method overriding: 
  * for PUT set header X-HTTP-Method-Override = PUT
  * for DELETE set header X-HTTP-Method-Override = DELETE
  * for POST set header X-HTTP-Method-Override = POST
* mongodb cluster connectivity (by providing array of { post: , host: } objects in config.db

REST responses:

* all responses are containing json({success: true or false, data: the data to be returned or which has been submitted})

Testing
-------

Testing is now done using vows/api-easy. Just run `vows ./tests/*.js` in the main folder.

Future
------

* REST - PUT /db/collection - Update whole collection with changes in PUT body
* Other useful commands (quit, reconnect, addUser, removeUser, etc)

Credits
-------

* [mongodb-rest](http://github.com/tdegrunt/mongodb-rest)
* [MongoDB Driver](http://github.com/christkv/node-mongodb-native)
* [Express](http://expressjs.com/)
* [npm](http://npmjs.org/)
