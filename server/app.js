/**
 * Module dependencies.
 */

var Logger = require('./lib/utils/Logger');
var logger = new Logger('app');

var express = require('express');
var http = require('http');

var bluemixContext = require('./lib/bluemixContext');
var appContext = require('./lib/appContext');
var samlApp = require('./lib/samlp/samlApp');
var apiApp = require('./lib/api/apiApp');
var webApp = require('./lib/web/webApp');
var config = require('./config');


var app = express();

// init app context
appContext.init(app, bluemixContext.getPort());

// init sub apps
webApp.init(app);
apiApp.init(app);
samlApp.init(app);


// start server
http.createServer(app).listen(bluemixContext.getPort(), function () {
  logger.info('Express server listening on port %d', bluemixContext.getPort());
});
