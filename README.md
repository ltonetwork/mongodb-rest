Name
----

mongodb-rest - REST server for MongoDB

Description
-----------

This is a REST server for MongoDB using Node, using the native node.js MongoDB driver.

Major update, now using Express

Installation
------------

Installation is now via npm: `npm install mongodb-rest`.
After that you can just issue `mongodb-rest` on the command line and the server should start.

Notes
-----

Supported REST requests:

* `GET /db/collection` - Returns all documents
* `GET /db/collection?query=%7B%22isDone%22%3A%20false%7D` - Returns all documents satisfying query
* `GET /db/collection?query=%7B%22isDone%22%3A%20false%7D&limit=2&skip=2` - Ability to add options to query (limit, skip, etc)
* `GET /db/collection/id` - Returns document with _id_
* `GET /db/collection/id?deep=true` - Returns document with _id_ and fetches all its deep nested object references
* `POST /db/collection` - Insert new document in collection (document in POST body)
  * when you need to post Object Reference send it as {namespace: "collection", oid: "123dsas2sdasd"}
* `PUT /db/collection/id` - Update document with _id_ (updated document in PUT body)w
  * when you need to update Object Reference send it as {namespace: "collection", oid: "123dsas2sdasd"}
  * when you send {"field.innerField":"..."} it will automaticly be converted to {field:{innerField:"..."}
* `DELETE /db/collection/id` - Delete document with _id_

REST responses:
* all responses are containing json({success: true or false, data: the data to be returned or which has been submitted})

Flavors:

* Setup "sproutcore" as flavor, it will then change _id as returned by MongoDB into guid, as used by SproutCore, this allows for simpler DataSources.

Content Type:

* Please make sure `application/json` is used as Content-Type when using POST/PUT with request body's.

Testing
-------

Testing is now done using expresso. Just run `expresso -s` in the main folder.
The SproutCore test needs to be run separately at the moment.

Future
------

* REST - PUT /db/collection - Update whole collection with changes in PUT body
* Other useful commands (quit, reconnect, addUser, removeUser, etc)

Credits
-------

* [MongoDB Driver](http://github.com/christkv/node-mongodb-native)
* [Express](http://expressjs.com/)
* [npm](http://npmjs.org/)
