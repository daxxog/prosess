/* UMD LOADER: https://github.com/umdjs/umd/blob/master/returnExports.js */
(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
  }
}(this, function() {
    var express = require('express'),
        whirlpool = require("whirlpool"),
        ObjectID = require('mongodb').ObjectID;
    
    return function(data) {
        var app = data.app,
            client = data.client,
            key = (typeof data.key != 'undefined') ? data.key : 'prosess',
            secret = (typeof data.secret != 'undefined') ? data.secret : 'secret',
            ttl = (typeof data.ttl != 'undefined') ? data.ttl : 3600;
        
        app.use(express.cookieParser(whirlpool(secret)));
        app.use(express.cookieSession({
            key: key
        }));
        
        var mw = function(req, res, next) {
            if(typeof req.session.id == 'undefined') {
                req.session.id = (new ObjectID()).toString();
            }
            
            client.exists(key + '_' + req.session.id, function(err, data) {
                if(!err) {
                    if(data === 0) {
                        req.prosess = {};
                        client.setex(key + '_' + req.session.id, ttl, JSON.stringify(req.prosess), function(err, data) {
                            if(!err) {
                                next();
                            } else {
                                console.error(err);
                            }
                        });
                    } else if(data === 1) {
                        client.get(key + '_' + req.session.id, function(err, data) {
                            if(!err) {
                                req.prosess = JSON.parse(data);
                                next();
                            } else {
                                console.error(err);
                            }
                        });
                    }
                } else {
                    console.error(err);
                }
            });
            
            res.on('header', function() {
                client.setex(key + '_' + req.session.id, ttl, JSON.stringify(req.prosess), function(err) {
                    if(err) {
                        console.error(err);
                    }
                });
            });
        };
        
        var ago = app.get;
        app.get = function() {
            var args = arguments,
                fx = args[1];
            
            args[1] = function(req, res) {
                var that = this,
                    args = arguments;
                
                mw(req, res, function() {
                    return fx.apply(that, args);
                });
            };
            
            return ago.apply(this, arguments);
        };
        
        var apo = app.post;
        app.post = function() {
            var args = arguments,
                fx = args[1];
            
            args[1] = function(req, res) {
                var that = this,
                    args = arguments;
                
                mw(req, res, function() {
                    return fx.apply(that, args);
                });
            };
            
            return apo.apply(this, arguments);
        };
    };
}));