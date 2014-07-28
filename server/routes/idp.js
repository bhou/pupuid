/**
 * Created by BHOU on 6/20/14.
 */
var samlp = require('../lib/samlp');
var xtend = require('xtend');
var fs = require('fs');
var passport = require('passport');
var db = require('../lib/db');
var querystring = require('querystring');

var mongoose = require('mongoose');
var dao = require('../lib/dao');
var User = dao.User;
var Attribute = dao.Attribute;

// credential used for saml provider
var credential = {
  cert: fs.readFileSync('./resources/cert.pem'),
  key: fs.readFileSync('./resources/key.pem')
}

var issuer = 'OpenU';
var redirectEndpointPath = '/samlp';
var postEndpointPath = '/samlp';

/**
 * the redirect end point
 * @param req
 * @param res
 * @param next
 */
function redirectEndPoint(req, res, next) {
  options = {
  };
  samlp.auth(xtend({}, {
    issuer: issuer,
    getPostURL: getPostURL,
    cert: credential.cert,
    key: credential.key
  }, options))(req, res);
}

/**
 * the post end point
 * @param req
 * @param res
 */
function postEndPoint(req, res, next) {
  options = {
  };
  samlp.auth(xtend({}, {
    issuer: issuer,
    getPostURL: getPostURL,
    cert: credential.cert,
    key: credential.key
  }, options))(req, res);
}

/**
 * get the metadata of the identity provider
 * @param req
 * @param res
 */
function idpMetadata(req, res) {
  samlp.metadata({
    issuer: issuer,
    cert: credential.cert,
    redirectEndpointPath: redirectEndpointPath,
    postEndpointPath: postEndpointPath
  })(req, res);
}

/**
 * retrieve the POST URL
 */
var postURLs = {  /*issuer: url pair*/
  'https://auth0-dev-ed.my.salesforce.com' : 'http://office.google.com',
  'passport-saml': 'http://localhost:3000/login/callback',
  'OaaS': 'http://localhost:9080/OaaS/consume.jsp'
}
function getPostURL(wtrealm, wreply, req, callback) {
  db.findAppBySamlId(wtrealm, function(err, apps){
    if (err) {
      return callback(err, null);
    }

    if (apps == null || apps.length == 0){
      return callback(null, 'http://ibm.com');
    }

    return callback(null, apps[0].postUrl);
  })
}

/**
 * login page for idp
 * @param req
 * @param res
 */
function login(req, res) {
  res.render('login');
}

function doLogin(req, res, next) {
  var relayState = req.param('RelayState');

  var port = req.app.settings.port || cfg.port;
  var currentUrl = req.protocol + '://' + req.host  + ( port == 80 || port == 443 ? '' : ':'+port);

  if (relayState == null) {
    relayState = currentUrl;
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }

    if (!user) {
      var errCode = "invalid_user";
      if (info!=null && info.message != null) {
        req.session.messages = [info.message];
      }else{
        req.session.messages = "Incorrect user name / password"
      }
      return res.redirect(currentUrl + '?error='+errCode);
    }

    // create token
    var attr = null;
    var attrs = user.attributes;
    var len = attrs.length;
    for (var i = 0; i < len; i++) {
      if (attrs[i].name == 'token') {
        attr = attrs[i];
        break;
      }
    }

    if (attr == null) {
      user.attributes.push(new Attribute({name: 'token', value: mongoose.Types.ObjectId()}));
      user.save(function(err, userObj) {
        req.logIn(userObj, function(err) {
          if (err) { return next(err); }
          if (req.session.samlquery!=null){
            return res.redirect('/samlp?' + req.session.samlquery);
          }else {
            return res.redirect(relayState);
          }
        });
      });
    } else {
      req.logIn(user, function(err) {
        if (err) { return next(err); }
          if (req.session.samlquery!=null){
            return res.redirect('/samlp?' + req.session.samlquery);
          }else {
            return res.redirect(relayState);
          }
      });
    }

  })(req, res, next);
}

function register(req, res) {
  res.render('register');
}

function doRegister(req, res, next) {
  var relayState = req.param('RelayState');

  var port = req.app.settings.port || cfg.port;
  var currentUrl = req.protocol + '://' + req.host  + ( port == 80 || port == 443 ? '' : ':'+port);

  if (relayState == null) {
    relayState = currentUrl;
  }

  var name = req.param('name');
  var email = req.param('email');
  var password = req.param('password');

  var errors = [];
  if (name == null || name.length < 2) {
    errors.push('please enter your user name, length > 2');
    if (name == ""){
      name = null;
    }
  }
  if (email == null || email.indexOf("@") == -1) {
    errors.push('please enter a valid e-mail address');
    if (email == "") {
      email = null;
    }
  }
  if (password == null || password.length < 6) {
    errors.push('password must be at least 6 letters/digitals');
  }

  if ( errors.length > 0 ) {
    res.render('register', {
        name: name,
        email: email
      }
    );
  } else {
    db.saveUser({
      name: req.param('name'),
      email: req.param('email'),
      password: req.param('password')
    }, function (err, docs) {
      if (err) {
        if (err.message.substring(0, 6)=='E11000') {
          req.session.messages = '该用户名或邮箱已经注册';
        }
        req.session.email = email;
        req.session.name = name;


        res.redirect('/login');
        return;
      }

//      sendWelcomeMail(req.param('email'), function(error, response){
//        if(error){
//          console.log(error);
//        }else{
//          console.log("Message sent: " + response.message);
//        }
//      });
      req.session.messages = null;
      return res.redirect('/login');
    });
  }
}


function updateUserAttr(req, res) {
  var name = req.params.name;
  db.updateUserAttr('53a4672455bd142c3051fdb1', 'surname', 'John', function(err, user, attr) {
    if (err) {
      console.error('update user attr error');
      return res.end(err);
    }

    return res.end('Done!')
  });
}


module.exports = {
  redirectEndPoint: redirectEndPoint,
  postEndpoint: postEndPoint,
  idpMetadata: idpMetadata,
  login: login,
  doLogin: doLogin,
  register: register,
  doRegister: doRegister,
  updateUserAttr: updateUserAttr
}
