var express = require('express'),
    RedisRing = require('redis-ring'),
    prosess = require('./prosess');
    
var app = express(),
    ring = [
        {"127.0.0.1:6379": 1}
    ],
    client = new RedisRing(ring);

prosess({
    app: app,
    client: client,
    secret: 'SANTA'
});

app.get('/', function(req, res) {
    if(typeof req.prosess.test == 'undefined') {
        req.prosess.test = 'hello world!';
        console.log('test');
    }
    
    res.json(req.prosess);
});

app.listen(7777);