/**
 * initiate the application context
 * Created by B.HOU on 8/19/2014.
 */
var Logger = require('./utils/Logger');
var logger = new Logger('appContext');

var express = require('express');
var MongoStore = require('connect-mongo')(express);
var passport = require('passport');
var path = require('path');
var db = require('../lib/data/db');
var config = require('../config');
var bluemixContext = require('./bluemixContext');

function init(app, port) {
  // connect the database
  var conn = "mongodb://" + config.mongostore.username + ":" + config.mongostore.password + "@"
    + config.mongostore.host + ":" + config.mongostore.port + "/" + config.mongostore.db;

  if (config.bluemix.enable) {
    logger.info('use bluemix defined db:' + bluemixContext.getConn());
    conn = bluemixContext.getConn();
  }
  db.startup(conn);

  app.set('port', process.env.PORT || port);
  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser('2014OpenUCookieParser2014'));
  app.use(express.session({store: new MongoStore(config.mongostore)}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, '../public')));

  app.set('jwtTokenSecret', 'OPEN-U TOKEN SECRET');

// development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }
}

module.exports = {
  init: init
}