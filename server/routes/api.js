/**
 * Created by BHOU on 6/21/14.
 * @module routes/api
 */
var Logger = require('../lib/utils/Logger');
var logger = new Logger('api');

var generatePwd = require('password-generator');
var mongoose = require('mongoose');
var db = require('../lib/data/db');
var models = require('../lib/data/models');
var User = models.User;
var Application = models.Application;
var Attribute = models.Attribute;

var INVALID_USER_ID = 499;
var ERROR_WHEN_FIND = 498;
var INVALID_ATTR_NAME = 497;
var ERROR_WHEN_UPDATE = 496;
var INVALID_EMAIL_FORMAT = 495;
var EMAIL_EXISTED = 494;
var CREATION_ERROR = 493;
var UNAUTHORIZED_APP = 492;
var FAILED_TO_CREATE_APP = 491;
var UNAUTHORIZED_USER = 490;
var USER_PASSWORD_INCORRECT = 489;

function ensureAppAuthenticated(req, res, next) {
  var app = req.header('app');
  var token = req.header('token');

  // for test only
  if (app == 'pupuid.test.app' && token == 'pupuid.test.token') {
    return next();
  }

  if (app == null || token == null) {
    return sendResponse(res, 400, 'Bad Request');
  }

  Application.findById(app, function (err, app) {
    if (err || app == null || app.token == null || app.token != token) {
      return sendResponse(res, 401, 'Unauthorized Application');
    }

    if (app.token == token) {
      return next();
    }

    sendResponse(res, 401, 'Unauthorized Application');
  });
}

/**
 @typedef UserInfo
 @type {Object}
 @property {string} id - user id
 @property {string} email - user email
 @property {string} name - user name
 @property {Array} attributes - user attributes
 */

/**
 * get user information
 * @param req  {object} request object
 * @param req.header.id {string} user id
 * @param req.header.email {string} email address
 * @param res {object} response object
 * @return {UserInfo} user information
 */
function getUserInfo(req, res) {
  var app = getArg(req, 'app');

  var id = getArg(req, 'id');

  if (id == null || "null" == id) {
    var email = getArg(req, 'email');
    if (email == null) {
      return sendResponse(res, 400, 'Invalid user id');
    }

    return User.find({"email": email}, function (err, users) {
      if (err) {
        return handleError(res, err, 500);
      }

      if (users == null || users.length == 0) {
        return sendResponse(res, 404, 'User Not Found');
      }

      prepareUserInfo(app, users[0], function (userinfo) {
        return sendResponse(res, 200, userinfo);
      });
    });
  }

  User.findById(id, function (err, user) {
    if (err) {
      return handleError(res, err, 500);
    }

    prepareUserInfo(app, user, function (userinfo) {
      return sendResponse(res, 200, userinfo);
    });
  });
}


/**
 * get user binding attribute
 * @param req {object} http request
 * @param req.header.email {string} user email
 * @param req.parameter.name  {string}  binding name, could be wechat/weibo/phone/qq
 * @param res {object} http response
 */
function getBindingAttr(req, res) {
  var email = getArg(req, 'email');
  var name = req.parameter.name;

  internalGetUserAttr(res, email, name);
}

/**
 * update user attribute
 * @param req {object} http request
 * @param res {object} http response
 * @param id  {string} user id
 * @param name  {string} attribute name
 * @param value {string} attribute value
 * @return {UserInfo}
 */
function doUpdateUserAttr(req, res, id, name, value) {
  var app = getArg(req, 'app');

  if (name == 'name') {
    // update user name
    User.findById(id, function (err, user) {
      if (err) {
        return handleError(res, err, 400);
      }

      user.name = value;
      user.save(function (err, savedUser) {
        if (err) {
          return handleError(res, err, 500);
        }

        prepareUserInfo(app, savedUser, function (userinfo) {
          sendResponse(res, 200, userinfo);
        });
      })
    });
  } else if (name == 'password') {
    // update user password
    User.findById(id, function (err, user) {
      if (err) {
        return handleError(res, err, 400);
      }

      user.setPassword(value, function (newUser) {
        prepareUserInfo(app, newUser, function (userinfo) {
          sendResponse(res, 200, userinfo);
        });
      })
    })
  } else {
    db.updateUserAttr(id, name, value, function (err, user, attr) {
      if (err) {
        return res.end(JSON.stringify({
          code: ERROR_WHEN_UPDATE,
          message: err
        }));
      }

      var ret = {
        code: 200,
        message: {}
      };
      ret.message = prepareUserInfo(app, user, function (userinfo) {
        return res.end(JSON.stringify(userinfo));
      });

    });
  }
}

/**
 * set user attribute, MUST have one of the id or email parameter
 * @param req {object} http request
 * @param req.header.name {string} attribute name
 * @param req.header.value {string} attribute value
 * @param req.header.id {string=} user id
 * @param req.header.email {string=} user email
 * @param res {object} http response
 * @returns {UserInfo}
 */
function setUserAttr(req, res) {
  var app = getArg(req, 'app');

  var name = getArg(req, 'name');
  if (name == null) {
    return res.end(JSON.stringify({
      code: INVALID_ATTR_NAME,
      message: 'Invalid attribute name'
    }));
  }

  var value = getArg(req, 'value');

  var id = getArg(req, 'id');
  if (id == null) {
    var email = getArg(req, 'email');
    if (email == null) {
      return res.end(JSON.stringify({
        code: INVALID_USER_ID,
        message: 'Invalid user id'
      }));
    }

    User.find({"email": email}, function (err, users) {
      if (err) {
        return res.end(JSON.stringify({
          code: INVALID_USER_ID,
          message: 'Invalid user id'
        }));
      }

      if (users == null || users.length == 0) {
        return res.end(JSON.stringify({
          code: INVALID_USER_ID,
          message: 'Invalid user id'
        }));
      }

      id = users[0].id;
      return doUpdateUserAttr(req, res, id, name, value);
    });
  } else {
    return doUpdateUserAttr(req, res, id, name, value);
  }
}

/**
 @typedef AppUserAttribute
 @type {Object}
 @property {string} name - attribute name
 @property {string} value - attribute value
 */
/**
 * set application user attribute
 * @param req {object} http request
 * @param req.header.email {string} user email
 * @param req.header.name {string} attribute name
 * @param req.header.value {string} attribute value
 * @param res {object} http response
 * @param return {AppUserAttribute}
 */
function setAppUserAttr(req, res) {
  var app = getArg(req, 'app');

  var email = getArg(req, 'email');
  var name = getArg(req, 'name');
  var value = getArg(req, 'value');

  db.setAppUserAttrByEmail(app, email, name, value, function (err, attr) {
    if (err) {
      logger.error(err.message);
      return res.status(404).end('Not found');
    }

    var attribute = {
      name: attr.name,
      value: attr.value
    };

    res.status(200).end(JSON.stringify(attribute));
  });
}

/**
 * get user attribtue value
 * @param req {object} http request
 * @param req.header.email {string} user email
 * @param req.header.attrName {string} attribute name
 * @param res {object} http response
 */
function getUserAttr(req, res) {
  var app = getArg(req, 'app');

  var email = getArg(req, 'email');
  var attrName = getArg(req, 'attrName');

  internalGetUserAttr(res, email, attrName);
}

function internalGetUserAttr(res, email, attrName) {
  if (email == null || attrName == null) {
    return sendResponse(res, 400, 'Bad Request');
  }

  db.findUserByEmail(email, function (err, user) {
    if (err) {
      return handleError(res, err, 400);
    }

    if (user == null) {
      return sendResponse(res, 404, 'Not Found');
    }

    var attributes = user.attributes;
    for (var i = 0; i < attributes.length; i++) {
      if (attributes[i].name == attrName) {
        return sendResponse(res, 200, attributes[i].value);
      }
    }

    db.findAllAppUserAttrByEmail(app, email, function (err, attrs) {
      if (err) {
        return handleError(res, err, 400);
      }

      if (attrs == null || attrs.length == 0) {
        sendResponse(res, 404, 'Not Found');
      }

      for (var i = 0; i < user.attrs.length; i++) {
        if (attrs[i].name == attrName) {
          return sendResponse(res, 200, attrs[i].value);
        }
      }

      return sendResponse(res, 404, 'Not Found');
    });
  });
}

/**
 * create a user
 * @param req {object} http request
 * @param req.header.email {string} user email
 * @param req.header.name {string} user name
 * @param req.header.password {string} user password
 * @param res {object} http response
 * @returns {UserInfo}
 */
function createUser(req, res) {
  var app = getArg(req, 'app');
  var email = getArg(req, 'email');
  if (email == null) {
    return res.end(JSON.stringify({
      code: INVALID_EMAIL_FORMAT,
      message: 'Invalid email format'
    }));
  }

  var password = getArg(req, 'password');
  var name = getArg(req, 'name');
  if (name == null) {
    name = 'anonymous';
  }

  db.saveUser({
    name: name,
    email: email,
    password: password
  }, function (err, docs) {
    ret = {
      code: 200,
      message: docs
    }
    if (err) {
      if (err.message.substring(0, 6) == 'E11000') {
        ret.code = EMAIL_EXISTED;
        ret.message = 'email already exists';
      }

      ret.code = CREATION_ERROR;
      ret.message = err.message;
      return res.end(JSON.stringify(ret));
    }

//      sendWelcomeMail(req.param('email'), function(error, response){
//        if(error){
//          console.log(error);
//        }else{
//          console.log("Message sent: " + response.message);
//        }
//      });
    ret.message = prepareUserInfo(app, docs, function (userinfo) {
      return res.end(JSON.stringify(userinfo));
    });
  });
}

/**
 * remove a user from db
 * @param req {object} http request
 * @param req.header.email {string} user email to delete
 * @param res {object} http response
 */
function removeUser(req, res) {
  var email = getArg(req, 'email');

  db.findUserByEmail(email, function (err, user) {
    if (err) {
      return res.status(400).end(JSON.stringify({
        code: 400,
        message: err.message
      }));
    }

    if (user == null) {
      return res.status(404).end(JSON.stringify({
        code: 404,
        message: 'User Not Found'
      }));
    }

    user.remove(function (err) {
      if (err) {
        return res.status(400).end(JSON.stringify({
          code: 400,
          message: err.message
        }));
      }

      return res.status(200).end();
    })
  });
}

/**
 * reset user password
 * @param req {object} http request
 * @param req.header.email {string} user email
 * @param res {object} http response
 */
function resetPassword(req, res) {
  var email = getArg(req, 'email');

  db.findUserByEmail(email, function (err, user) {
    if (err) {
      return handleError(err, 400);
    }

    if (user == null) {
      return sendResponse(res, 404, 'Not Found');
    }

    var newPwd = generatePwd(12, false);
    user.setPassword(newPwd, function () {
      // TODO: send email to user
      sendResponse(res, 200, 'OK');
    })
  });
}

/**
 @typedef Application
 @type {Object}
 @property {string} samlId - application saml id
 @property {string} postUrl - saml consumer url
 @property {string} token - application token
 */

/**
 * create a new application
 * @param req {object} http request
 * @param req.header.samlId {string} application saml id
 * @param req.header.postUrl {string} saml consumer url
 * @param res {object} http response
 * @return {Application}
 */
function newApplication(req, res) {
  var app = new Application();
  app.token = mongoose.Types.ObjectId();

  var samlId = getArg(req, 'samlId');
  var postUrl = getArg(req, 'postUrl');

  if (samlId == null) {
    samlId = "";
  }

  if (postUrl == null) {
    postUrl = "";
  }

  app.samlId = samlId;
  app.postUrl = postUrl;

  app.save(function (err, application) {
    if (err) {
      return res.end(JSON.stringify({
        code: FAILED_TO_CREATE_APP,
        message: 'Failed to create application:' + err.message
      }));
    }

    return res.end(JSON.stringify({
      code: 200,
      message: application
    }))
  });
}

/**
 * delete an application
 * @param req {object} http request
 * @param req.header.samlId {string} application saml id
 * @param res {object} http response
 */
function deleteApplication(req, res) {
  var samlId = getArg(req, 'samlId');

  db.findAppBySamlId(samlId, function (err, app) {
    if (err) {
      return res.status(400).end(JSON.stringify({
        code: 400,
        message: err.message
      }));
    }

    if (app == null || app.length == 0) {
      return sendResponse(res, 404, 'Not Found');
    }

    app[0].remove(function (err) {
      if (err) {
        return res.status(400).end(JSON.stringify({
          code: 400,
          message: err.message
        }));
      }

      res.status(200).end('OK');
    })
  });
}

/**
 * list all the applications
 * @param req {object} http request
 * @param res {object} http response
 * @return {Application} list of application
 */
function listApps(req, res) {
  Application.find({}, function (err, apps) {
    if (err || apps == null || apps.length == 0) {
      return res.end("No application");
    }

    return res.render("apps", {apps: apps});
  });
}


/**
 @typedef UserToken
 @type {Object}
 @property {string} email - user email
 @property {string} token - token
 */
/**
 * login
 * @param req {object} http request
 * @param req.header.email {string} user email
 * @param req.header.password {string} user password
 * @param res {object} http request
 * @return {UserToken}
 */
function login(req, res) {
  var email = getArg(req, 'email');
  var password = getArg(req, 'password');

  res.setHeader("Content-Type", "application/json");

  User.find({email: email}, function (err, user) {
    if (err || user == null || user.length == 0) {
      return handleError(res, err, 404);
    }

    user[0].verifyPassword(password, function (err, passwordCorrect) {
      if (err) {
        return handleError(res, err, 401);
      }
      if (!passwordCorrect) {
        return sendResponse(res, 401, 'user/password incorrect');
      }

      db.getUserAttr(user[0]._id, 'token', function (err, user, attr) {
        if (err) {
          handleError(res, err, 401);
        }

        var attribute = attr;
        if (attr == null) {
          attribute = new Attribute({name: 'token', value: mongoose.Types.ObjectId()});
          user.attributes.push(attribute);
        } else {
          if (attribute.value == null) {
            attribute.value = mongoose.Types.ObjectId();
          }
        }

        user.save(function(err, newUser) {
          return sendResponse(res, 200, {
            email: email,
            token: attribute.value});
        });
      });
    });
  })
}

/**
 * verify user token
 * @param req {object} http request
 * @param req.header.email {string} user email
 * @param req.header.token {string} user token
 * @param res {object} http response
 * @return {UserToken}
 */
function verifyToken(req, res) {
  var email = getArg(req, 'email');
  var token = getArg(req, 'token');

  if (email == null || token == null) {
    res.status(400).send('Bad Request');
  }

  User.find({email: email}, function (err, user) {
    if (err || user == null || user.length == 0) {
      return res.status(404).end(JSON.stringify({
        code: UNAUTHORIZED_USER,
        message: 'could not find user: ' + email
      }));
    }

    db.getUserAttr(user[0]._id, 'token', function (err, user, attr) {
      if (err) {
        return res.status(500).end(JSON.stringify({
          code: UNAUTHORIZED_USER,
          message: 'Error when finding token of the user: ' + email
        }));
      }

      var attribute = attr;
      if (attr == null) {
        attribute = new Attribute({name: 'token', value: mongoose.Types.ObjectId()});
        user.attributes.push(attribute);
      } else {
        if (attribute.value == null) {
          attribute.value = mongoose.Types.ObjectId();
        }
      }
      user.save();

      if (attribute.value != token) {
        return res.status(409).end(JSON.stringify({
          code: 200,
          message: {
            email: email,
            token: attribute.value}
        }));
      }

      return res.end(JSON.stringify({
        code: 200,
        message: {
          email: email,
          token: attribute.value}
      }));
    });
  })
}

/**
 * prepare user information
 * @param appId {string} application information
 * @param user  {object} user object
 * @param done {function} callback function(userinfo)
 */
function prepareUserInfo(appId, user, done) {
  var ret = {}
  ret.id = user._id;
  ret.email = user.email;
  ret.name = user.name;
  ret.attributes = user.attributes;

  // get app specific attr
  db.findAllAppUserAttrByEmail(appId, user.email, function (err, attrs) {
    if (err) {
      done(ret);
    }

    var i = 0;
    var attr = null;
    for (i = 0; i < attrs.length; i++) {
      attr = {
        name: attrs[i].name,
        value: attrs[i].value
      };

      ret.attributes.push(attr);
    }

    done(ret);
  });
}

/**
 * @deprecated
 * @param req
 * @param res
 */
function removeAppUserAttr(req, res) {
  var app = getArg(req, 'app');
  var email = getArg(req, 'email');
  var attrName = getArg(req, 'attrName');

  db.findAppUserAttrByEmail(app, email, attrName, function (err, attrs) {
    if (err) {
      return handleError(res, 400);
    }

    if (attrs == null || attrs.length == 0) {
      return sendResponse(res, 404, 'Not Found');
    }

    var getCallback = function () {
      // closure
      var counter = 0;
      var total = attrs.length;
      return function (err) {
        if (err) {
          logger.error(err.message);
        }

        if (counter >= total) {
          return sendResponse(res, 200, 'OK');
        }
        counter++;
      }
    }

    var cb = getCallback();
    var i = 0;
    for (i = 0; i < attrs.length; i++) {
      attrs[i].remove(function (err) {
        cb(err);
      });
    }
  });
}

/**
 * default error handler
 * @param res {object} http response
 * @param err {object} error object
 * @param code {number} return status code
 * @param done  {function=} optional, call back function
 * @returns {*}
 */
function handleError(res, err, code, done) {
  logger.error(err.message);

  if (done) {
    return done(err);
  }

  return sendResponse(res, code, err.message);
}

/**
 * send response
 * @param res {object} http response
 * @param code  {number} http status code
 * @param message {string | object} return message
 * @returns {*}
 */
function sendResponse(res, code, message) {
  return res.status(code).end(JSON.stringify({
    code: code,
    message: message
  }))
}

/**
 * get api arguments
 * @param req {object} http request
 * @param name  {string} argument name
 */
function getArg(req, name) {
  // get parameter from header
  return req.header(name);
}


module.exports = {
  ensureAppAuthenticated: ensureAppAuthenticated,

  createUser: createUser,
  removeUser: removeUser,
  getUserInfo: getUserInfo,
  getUserAttr: getUserAttr,
  setUserAttr: setUserAttr,
  setAppUserAttr: setAppUserAttr,
  removeAppUserAttr: removeAppUserAttr,
  resetPassword: resetPassword,
  getBindingAttr: getBindingAttr,

  newApplication: newApplication,
  deleteApplication: deleteApplication,
  listApps: listApps,

  login: login,
  verifyToken: verifyToken

}
