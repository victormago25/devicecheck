var express = require('express');
var app = express();
app.use(express.static(__dirname));
app.use(app.router);
//app.get('/:file', function(req, res){
//    var file = req.params.file;
//    res.sendfile(file);
//});
app.listen(8080);
