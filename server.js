/*jslint node: true */
"use strict";


var bunyan = require('bunyan');
var fs = require('fs');
var restify = require('restify');

var config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
var log = bunyan.createLogger({
  name: config.server.name,
  stream: process.stdout,
  level: config.log.level
});

function Server(config, log) {
  var self = this;
  this.name = config.name;
  this.port = config.port;
  this.log = log;
}

Server.prototype.run = function () {
  var self = this;
  var server = this.server = restify.createServer({log: self.log});

  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.dateParser(60));
  server.use(restify.queryParser());
  server.use(restify.gzipResponse());
  server.use(restify.requestLogger());

  server.get('/ping', function(req, res, next) {
    res.send({status: 'success', 'message': 'pong'});
    next();
  });

  server.get(/\/app\/?.*/, restify.serveStatic({
    directory: __dirname,
    default: 'index.html',
  }));

  server.get(/\/static\/?.*/, restify.serveStatic({
    directory: __dirname,
  }));

  server.on('uncaughtException', function (req, res, route, err) {
    self.log.error("uncaughtException:", err);
    res.send(err);
  });

  self.log.info('Starting app');
  server.listen(self.port, function() {
    self.log.info('%s listening at %s', self.name, server.url);
  });

};

Server.prototype.shutdown = function (callback) {
  this.log.info('Shutting down', this.name);
  if (this.server) {
    this.server.close(callback);
  } else {
    callback();
  }
};

var server = new Server(config.server, log);
server.run();

function shutdown() {
  server.shutdown(function(status) {
    console.log("Exiting process");
    process.exit();
  });
}

process.on('SIGHUP', function() {
  console.log("Shutting down");
  shutdown();
});

process.on('SIGTERM', function() {
  console.log("Shutting down");
  shutdown();
});
