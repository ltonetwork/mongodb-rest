var app = module.parent.exports.app;

app.get('/', function(req, res){
    res.send('index');
});
