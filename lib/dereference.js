var ObjectID = require("mongodb/lib/mongodb/bson/bson").ObjectID;
var DBRef = require("mongodb/lib/mongodb/bson/bson").DBRef;

var sys = require("sys");

module.exports = function(db, data, callback) {
    
    
    var fetchReferencesCount = 0;
    var fetchedReferences = [];
    
    var dereferenceObj = function(obj) {
    
        if(typeof obj['namespace'] != "undefined" && 
           typeof obj['oid'] != "undefined" && 
           fetchedReferences.indexOf(obj['oid']) == -1) {
           
           var dbref = null;
           if(/^[0-9a-fA-F]{24}$/.test(obj['oid']))
                dbref = new DBRef(obj['namespace'], new ObjectID(obj['oid']));
           else
                dbref = new DBRef(obj['namespace'], obj['oid']);
           
           fetchReferencesCount += 1;
           db.dereference(dbref, function(err, result) {
                if(err != null) {
                    callback(err);
                    return;
                }
                
                if(result) {
                    fetchedReferences.push(result._id.toString());
                    
                    for(var i in result)
                        obj[i] = result[i];
                        
                    delete obj['namespace'];
                    delete obj['oid'];
                    
                    dereferenceData(obj);
                }
                
                fetchReferencesCount -= 1;
                if(fetchReferencesCount <= 0)
                    callback(err);
            });
            return;
        }
        
        var fieldsToDereference = [];
        for(var i in obj) {
            if(obj[i] == null) {
                // do notehing
            } else if(typeof obj == "object" && 
               typeof obj[i]['namespace'] != "undefined" && 
               typeof obj[i]['oid'] != "undefined" &&
               fetchedReferences.indexOf(obj[i]['oid']) == -1) {
               
                fetchReferencesCount += 1;
                fieldsToDereference.push(i);
                
            } else if(Array.isArray(obj[i])) {
                dereferenceData(obj[i]);
            }
        }
        
        if(fieldsToDereference.length > 0) {
            fieldsToDereference.forEach(function(key) {
                
                db.dereference(obj[key], function(err, result) {
                    if(err != null) {
                        callback(err);
                        return;
                    }
                    
                    if(result) {
                        fetchedReferences.push(result._id.toString());
                        
                        obj[key] = result;
                        dereferenceData(obj[key]);
                    }
                    
                    fetchReferencesCount -= 1;
                    if(fetchReferencesCount <= 0)
                        callback(err);
                });
            });
        }
            
    };
    
    var dereferenceData = function(obj) {
        if(Array.isArray(obj))
            for(var i = 0; i<obj.length; i++)
                dereferenceObj(obj[i]);
        else
            dereferenceObj(obj);
    };
    
    dereferenceData(data);
    
    if(fetchReferencesCount <= 0)
        callback(null);
}
