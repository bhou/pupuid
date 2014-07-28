/**
 * Created by BHOU on 6/21/14.
 */
var mongoose = require('mongoose');
var db = require('../lib/db');
var dao = require('../lib/dao');
var User = dao.User;
var Application = dao.Application;
var Attribute = dao.Attribute;

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

  if (app == null || token == null) {
    return res.end(JSON.stringify({
      code: UNAUTHORIZED_APP,
      message: 'unauthorized application'
    }));
  }

  Application.findById(app, function (err, app) {
    if (err || app == null || app.token == null || app.token != token) {
      return res.end(JSON.stringify({
        code: UNAUTHORIZED_APP,
        message: 'unauthorized'
      }));
    }

    if (app.token == token) {
      return next();
    }

    res.end(JSON.stringify({
      code: UNAUTHORIZED_APP,
      message: 'unauthorized'
    }));
  });

  //  db.getUserAttr(app, 'stoken', function(err, user, attr) {
  //    if (err || user == null || attr == null || user.role != User.APP) {
  //      return res.end(JSON.stringify({
  //        code: UNAUTHORIZED_APP,
  //        message: 'unauthorized'
  //      }));
  //    }
  //
  //    if (attr.value == token) {
  //      return next();
  //    }
  //
  //    res.end(JSON.stringify({
  //      code: UNAUTHORIZED_APP,
  //      message: 'unauthorized application'
  //    }));
  //  });
}

function getUserInfo(req, res) {
  var id = req.params.id;

  if (id == null || "null" == id) {
    var email = req.body.email;
    if (email == null) {
      return res.end(JSON.stringify({
        code: INVALID_USER_ID,
        message: 'Invalid user id'
      }));
    }

    return User.find({"email": email}, function (err, users) {
      if (err) {
        return res.end(JSON.stringify({
          code: ERROR_WHEN_FIND,
          message: err.message
        }));
      }

      if (users == null || users.length == 0){
        return res.end(JSON.stringify({
          code: ERROR_WHEN_FIND,
          message: 'No such user!'
        }));
      }

      var ret = {
        code: 200,
        message: {}
      };

      ret.message = prepareUserInfo(users[0]);

      return res.end(JSON.stringify(ret));
    });
  }

  User.findById(id, function (err, user) {
    if (err) {
      return res.end(JSON.stringify({
        code: ERROR_WHEN_FIND,
        message: err.message
      }));
    }

    var ret = {
      code: 200,
      message: {}
    };
    ret.message = prepareUserInfo(user);

    return res.end(JSON.stringify(ret));
  });
}

function doUpdateUserAttr(req, res, id, name, value) {
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
    ret.message = prepareUserInfo(user);
    return res.end(JSON.stringify(ret));
  });
}
function setUserAttr(req, res) {
  var name = req.body.name;
  if (name == null) {
    return res.end(JSON.stringify({
      code: INVALID_ATTR_NAME,
      message: 'Invalid attribute name'
    }));
  }

  var value = req.body.value;

  var id = req.params.id;
  if (id == null) {
    var email = req.body.email;
    if (email == null) {
      return res.end(JSON.stringify({
        code: INVALID_USER_ID,
        message: 'Invalid user id'
      }));
    }

    User.find({"email": email}, function(err, users){
      if (err) {
        return res.end(JSON.stringify({
          code: INVALID_USER_ID,
          message: 'Invalid user id'
        }));
      }

      if (users == null || users.length == 0){
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

function createUser(req, res) {
  var email = req.body.email;
  if (email == null) {
    return res.end(JSON.stringify({
      code: INVALID_EMAIL_FORMAT,
      message: 'Invalid email format'
    }));
  }

  var password = req.body.password;
  var name = req.body.name;
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
    ret.message = prepareUserInfo(docs);
    return res.end(JSON.stringify(ret));
  });
}

function newApplication(req, res) {
  var app = new Application();
  app.token = mongoose.Types.ObjectId();

  var samlId = req.body.samlId;
  var postUrl = req.body.postUrl;

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

function listApps(req, res) {
  Application.find({}, function(err, apps){
    if (err || apps == null || apps.length == 0) {
      return res.end("No application");
    }

    return res.render("apps", {apps:apps});
  });
}

function login(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  res.setHeader("Content-Type", "application/json");

  User.find({email: email}, function (err, user) {
    if (err || user == null || user.length == 0) {
      return res.end(JSON.stringify({
        code: UNAUTHORIZED_USER,
        message: 'unauthorized user: ' + email
      }));
    }

    user[0].verifyPassword(password, function(err, passwordCorrect) {
      if (err) {
        return res.end(JSON.stringify({
          code: USER_PASSWORD_INCORRECT,
          message: err.message
        }));
      }
      if (!passwordCorrect) {
        return res.end(JSON.stringify({
          code: USER_PASSWORD_INCORRECT,
          message: 'user/password incorrect'
        }));
      }

      db.getUserAttr(user[0]._id, 'token', function(err, user, attr){
        if (err) {
          return res.end(JSON.stringify({
            code: UNAUTHORIZED_USER,
            message: 'unauthorized user: ' + email
          }));
        }

        var attribute = attr;
        if (attr == null) {
          attribute = new Attribute({name:'token', value:mongoose.Types.ObjectId()});
          user.attributes.push(attribute);
        } else {
          if (attribute.value == null) {
            attribute.value = mongoose.Types.ObjectId();
          }
        }
        user.save();

        return res.end(JSON.stringify({
          code: 200,
          message: {
            email: email,
            token: attribute.value}
        }));
      });
    });
  })
}

function verifyToken(req, res) {
  var email = req.body.email;
  var token = req.body.token;

  if(email == null || token == null) {
    res.status(400).send('Bad Request');
  }

  User.find({email: email}, function (err, user) {
    if (err || user == null || user.length == 0) {
      return res.status(404).end(JSON.stringify({
        code: UNAUTHORIZED_USER,
        message: 'could not find user: ' + email
      }));
    }

    db.getUserAttr(user[0]._id, 'token', function(err, user, attr){
      if (err) {
        return res.status(500).end(JSON.stringify({
          code: UNAUTHORIZED_USER,
          message: 'Error when finding token of the user: ' + email
        }));
      }

      var attribute = attr;
      if (attr == null) {
        attribute = new Attribute({name:'token', value:mongoose.Types.ObjectId()});
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
 * return
 * @param user
 * @returns {{}}
 */
function prepareUserInfo(user) {
  var ret = {}
  ret.id = user._id;
  ret.email = user.email;
  ret.name = user.name;
  ret.attributes = user.attributes;

  return ret;
}


module.exports = {
  ensureAppAuthenticated: ensureAppAuthenticated,
  getUserInfo: getUserInfo,
  setUserAttr: setUserAttr,
  createUser: createUser,
  newApplication: newApplication,
  listApps: listApps,
  login: login,
  verifyToken: verifyToken
}