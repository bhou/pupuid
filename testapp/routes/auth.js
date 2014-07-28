/**
 * Created by BHOU on 7/21/2014.
 */
var request = require('request');
var nodemailer = require("nodemailer");
var config = require('../config');

var appId = config.appId;
var token = config.token;

function internalLogin(res, email, password, relayState, callback) {
  res.render('oaas/loginForm', {
    callback: config.idpUrl + '/doLogin',
    email: email,
    password: password,
    RelayState: relayState
  });
//  var options = {
//    url: 'http://localhost:3001/api/login',
//    method: 'post',
//    headers: {
//      'Content-Type': 'application/json',
//      'app': appId,
//      'token': appToken
//    },
//    body: JSON.stringify({
//      email: email,
//      password: password
//    })
//  };
//
//  request(options, function (err, response, body) {
//    if (!err && response.statusCode == 200) {
//      try {
//        var info = JSON.parse(body);
//        if (info.code != '200') {
//          return callback(new Error('Unauthorized'));
//        } else {
//          return res.status(200).redirect(successUrl);
//        }
//      } catch (err) {
//        return callback(err);
//      }
//    } else {
//      return callback(new Error('Unauthorized'));
//    }
//  });
}

function doLogin(req, res) {
  var email = req.param('email');
  var password = req.param('password');

  var relayState = req.param('RelayState');

  var port = req.app.settings.port || cfg.port;
  var currentUrl = req.protocol + '://' + req.host + ( port == 80 || port == 443 ? '' : ':' + port);

  if (relayState == null) {
    relayState = currentUrl;
  }

  internalLogin(res, email, password, relayState, function (err) {
    if (err) {
      return res.status(401).end(err.message);
    }

    return res.redirect(relayState);
  });
}

function internalRegister(res, appId, token, email, name, password, callback) {
  var options = {
    url: config.idpUrl + '/api/user',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'app': appId,
      'token': token
    },
    body: JSON.stringify({
      email: email,
      password: password,
      name: name
    })
  };

  request(options, function (err, response, body) {
    if (!err && response.statusCode == 200) {
      try {
        var info = JSON.parse(body);
        if (info.code != '200') {
          return callback(new Error('Unauthorized'));
        } else {
          return callback(null, email, name, password);
        }
      } catch (err) {
        return callback(err);
      }
    } else {
      return callback(new Error('Unauthorized'));
    }
  });
}

function doRegister(req, res) {
  var email = req.param('email');
  var name = req.param('name');
  var password = req.param('password');

  var port = req.app.settings.port || cfg.port;
  var failedUrl = req.protocol + '://' + req.host + ( port == 80 || port == 443 ? '' : ':' + port) + '/auth#toregister';
  var successUrl = req.protocol + '://' + req.host + ( port == 80 || port == 443 ? '' : ':' + port) + '/auth#tologin';

  var relayState = req.param('RelayState');
  if (relayState == null) {
    relayState = successUrl;
  }

  internalRegister(res, appId, token, email, name, password, function (err, email, name, password) {
    if (err) {
      return res.status(401).end(err.message);
    }

    internalSubscribe(res, appId, token, email, function (err, email) {
      if (err) {
        return res.status(401).end(err.message);
      }

      internalGetUserInfo(res, null, email, function (err, user) {
        if (err) {
          return res.status(401).end(err.message);
        }

        sendWelcomeMail(email, user.id, function (err, response) {
          if (err) {
            return res.status(401).end(err.message);
          }
          return res.render('oaas/registerDone');
          //return res.redirect(relayState);
        });
      });
    });

//    internalLogin(res, email, password, relayState, function(err) {
//      if (err) {
//        return res.status(401).end(err);
//      }
//
//      return res.redirect(relayState);
//    });
  })
}

function internalSubscribe(res, appId, token, email, callback) {
  var options = {
    url: config.idpUrl + '/api/user',
    method: 'put',
    headers: {
      'Content-Type': 'application/json',
      'app': appId,
      'token': token
    },
    body: JSON.stringify({
      email: email,
      name: 'oaas_trial',
      value: 'subscribed'
    })
  };

  request(options, function (err, response, body) {
    if (!err && response.statusCode == 200) {
      try {
        var info = JSON.parse(body);
        if (info.code != '200') {
          return callback(new Error('Unauthorized'));
        } else {
          return callback(null, email);
        }
      } catch (err) {
        return callback(err);
      }
    } else {
      return callback(new Error('Unauthorized'));
    }
  });
}

function doSubscribe(req, res) {
  var email = req.param('email');

  var relayState = req.param('RelayState');
  if (relayState == null) {
    relayState = config.relayState;
  }

  var port = req.app.settings.port || cfg.port;
  var failedUrl = req.protocol + '://' + req.host + ( port == 80 || port == 443 ? '' : ':' + port) + '/auth#toregister?RelayState=' + relayState;
  var successUrl = req.protocol + '://' + req.host + ( port == 80 || port == 443 ? '' : ':' + port) + '/auth#tologin?RelayState=' + relayState;


  internalSubscribe(res, appId, token, email, function (err, email) {
    if (err) {
      return res.status(401).end(err.message);
    }

    internalGetUserInfo(res, null, email, function (err, user) {
      if (err) {
        return res.status(401).end(err.message);
      }

      sendWelcomeMail(email, user.id, function (err, response) {
        if (err) {
          return res.status(401).end(err.message);
        }

        return res.render('oaas/registerDone');
        //return res.redirect(relayState);
      });
    });
  });
}

function internalGetUserInfo(res, id, email, callback) {
  var url = config.idpUrl + '/api/user'
  if (!id) {
    url = url + '/' + id;
  }

  var options = {
    url: url,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'app': appId,
      'token': token
    },
    body: JSON.stringify({
      email: email
    })
  };

  request(options, function (err, response, body) {
    if (!err && response.statusCode == 200) {
      try {
        var info = JSON.parse(body);
        if (info.code != '200') {
          return callback(new Error('Unknown user'));
        } else {
          return callback(null, info.message);
        }
      } catch (err) {
        return callback(err);
      }
    } else {
      return callback(new Error('Unknown user'));
    }
  });
}

function sendWelcomeMail(dest, id, callback) {
  var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "bebeservicefr@gmail.com",
      pass: "123456qbc"
    }
  });

  var activateUrl = config.localUrl + '/activate/' + id + '?RelayState=' + config.relayState;
  var mailOptions = {
    from: "Decision Optim Serivce <bebeservicefr@gmail.com>", // sender address
    to: dest, // list of receivers
    subject: "Welcome to Decision Optim Service", // Subject line
    text: "Thank you for registering on Decision Optimization Service. You can click the following link to try your free trial.\n" +
      activateUrl, // plaintext body
    html: "Thank you for registering on Decision Optimization Service. You can click the following link to try your free trial</br>" +
      "<a href=\"" + activateUrl + "\">" + activateUrl + "</a>" // html body
  }

  // send mail with defined transport object
  smtpTransport.sendMail(mailOptions, callback);
}

function internalActivate(res, id, callback) {
  var options = {
    url: config.idpUrl + '/api/user/' + id,
    method: 'put',
    headers: {
      'Content-Type': 'application/json',
      'app': appId,
      'token': token
    },
    body: JSON.stringify({
      name: 'oaas_trial',
      value: 'activated'
    })
  };

  request(options, function (err, response, body) {
    if (!err && response.statusCode == 200) {
      try {
        var info = JSON.parse(body);
        if (info.code != '200') {
          return callback(new Error('Unauthorized'));
        } else {
          return callback(null);
        }
      } catch (err) {
        return callback(err);
      }
    } else {
      return callback(new Error('Unauthorized'));
    }
  });
}

function doActivate(req, res) {
  var id = req.params.id;

  var relayState = req.param('RelayState');
  if (relayState == null) {
    relayState = config.relayState;
  }

  internalActivate(res, id, function (err) {
    if (err) {
      return res.status(404).end(err.message);
    }

    return res.render('oaas/auth', {
      RelayState: relayState
    });
    //return res.redirect(relayState);
  });
}

module.exports = {
  doLogin: doLogin,
  doRegister: doRegister,
  doSubscribe: doSubscribe,
  doActivate: doActivate
}
