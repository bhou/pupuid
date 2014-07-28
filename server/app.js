/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var idp = require('./routes/idp');
var api = require('./routes/api');
var MongoStore = require('connect-mongo')(express);
var passport = require('passport');
var config = require('./config');
var db = require('./lib/db');
var User = require('./lib/dao').User;

//=============== BEGIN OF BLUEMIX ENV

// There are many useful environment variables available in process.env,
// please refer to the following document for detailed description:
// http://ng.w3.bluemix.net/docs/FAQ.jsp#env_var

// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
// TODO: Get service credentials and communicate with bluemix services.
if (services["mongodb-2.2"]) {
  config.mongostore.db = services["mongodb-2.2"].credentials.db;
  config.mongostore.host = services["mongodb-2.2"].credentials.host;
  config.mongostore.username = services["mongodb-2.2"].credentials.username;
  config.mongostore.password = services["mongodb-2.2"].credentials.password;
  config.mongostore.port = services["mongodb-2.2"].credentials.port;
}

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3002);

//============== END OF BLUEMIX ENV


var app = express();

// connect the database
var conn = "mongodb://" + config.mongostore.username + ":" + config.mongostore.password + "@"
  + config.mongostore.host + ":" + config.mongostore.port + "/" + config.mongostore.db;
console.log('db connection:' + conn);
db.startup(conn);


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
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
app.use(express.static(path.join(__dirname, 'public')));

app.set('jwtTokenSecret', 'OPEN-U TOKEN SECRET');

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

/**
 * web interface
 */
app.get('/register', idp.register);
app.post('/doRegister', idp.doRegister);

app.get('/login', idp.login);
app.post('/doLogin', idp.doLogin);

/**
 * API
 * this is used by the application / client
 */
// api for admin
app.get('/api/apps', api.listApps);
app.post('/api/app', api.newApplication); // create a new application

// api for application
app.post('/api/login', api.ensureAppAuthenticated, api.login);   // get the login token
app.post('/api/verify', api.ensureAppAuthenticated, api.verifyToken);  // verify if the user token is valide
app.get('/api/user/:id', api.ensureAppAuthenticated, api.getUserInfo);    // get user information
app.post('/api/userinfo/:id', api.ensureAppAuthenticated, api.getUserInfo)
app.post('/api/user', api.ensureAppAuthenticated, api.createUser);    // create user information
app.put('/api/user/:id', api.ensureAppAuthenticated, api.setUserAttr);   // update user information
app.put('/api/user', api.ensureAppAuthenticated, api.setUserAttr);   // update user information


/**
 * saml provider
 */
//configure samlp middleware
app.get('/samlp', idp.redirectEndPoint);
app.post('/samlp', idp.postEndpoint);
app.get('/samlp/metadata.xml', idp.idpMetadata);


// start server
http.createServer(app).listen(port, function () {
  console.log('Express server listening on port ' + port);// + app.get('port'));
});
