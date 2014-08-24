/**
 * utils for accessing data base
 * Created by BHOU on 6/20/14.
 * @module lib/data/db
 * @author BHOU
 */

var Logger = require('../utils/Logger');
var logger = new Logger('db');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var models = require('./models');

var User = models.User;
var Attribute = models.Attribute;
var Application = models.Application;

//------------------------------------------------------------------
// Passport
//------------------------------------------------------------------
// Define local strategy for Passport
passport.use(new LocalStrategy({
    usernameField: 'email'
  },

  function (email, password, done) {
    User.authenticate(email, password, function (err, user) {
      return done(err, user);
    });
  }
));

// serialize user on login
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// deserialize user on logout
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//------------------------------------------------------------------
// API
//------------------------------------------------------------------

function startup(db) {
  logger.info('startup: ' + db);
  mongoose.connect(db);

  mongoose.connection.on('open', function () {
    logger.info('connected to db %s', db);
  });
}

function close() {
  mongoose.connection.close();
}

/**
 * create a user and save it
 * @param user    {object} the json object of user
 * @param callback  {function}  callback function (err, user)
 */
function saveUser(user, callback) {
  var newUser = new User({
    name: user.name, email: user.email
  }).setPassword(user.password, function (newUser) {
      newUser.save(function (err, user) {
        callback(err, user);
      });
    });
}

/**
 * get user attribute
 * @param uid   {string} user id
 * @param name  {string} user name
 * @param callback  {function} callback function(err, user)
 */
function getUserAttr(uid, name, callback) {
  User.findById(uid).exec(function (err, user) {
    if (err) {
      return callback(err, user);
    }

    var attrs = user.attributes;
    if (attrs == null || attrs.length == 0) {
      callback(err, user, null);
    } else {
      var i = 0;
      for (i = 0; i < attrs.length; i++) {
        if (attrs[i].name == name) {
          callback(err, user, attrs[i]);
          return;
        }
      }

      callback(err, user, null);
    }
  });
}

/**
 * update user attribute
 * @param uid {string} user id
 * @param name  {string} attribute name
 * @param value {string}  attribute value
 * @param callback  {function} callback function(err, user, attribute)
 */
function updateUserAttr(uid, name, value, callback) {
  getUserAttr(uid, name, function (err, user, attr) {
    if (err) {
      return callback(err, user, attr);
    }

    if (attr != null && attr.name == name) {
      attr.value = value;
    } else {
      attr = new Attribute({name: name, value: value});
      user.attributes.push(attr);
    }

    user.save(function(err){
      callback(err, user, attr);
    });
  });
}

/**
 * find the application by its saml id
 * @param samlId  {string} the saml id of the application
 * @param callback  {function} callback function( err, app )
 */
function findApplicationBySamlId(samlId, callback) {
  Application.find({samlId: samlId}, function (err, app) {
    if (err) {
      return callback(err, null);
    }

    return callback(err, app);
  });
}

/**
 * remove a user by its email
 * @param email {string} email address
 * @param callback  {function} callback function(err)
 */
function removeUserByEmail(email, callback) {
  User.find({'email': email}).remove(callback);
}

/**
 * find a user by its email
 * @param email {string} email address
 * @param done {function} callback function(err, user)
 */
function findUserByEmail(email, done) {
  User.find({'email': email}, function(err, users) {
    if (err) {
      done(err);
      return;
    }

    if (users.length == 0) {
      done(new Error('Not found!'));
      return;
    }

    done(null, users[0]);
  })
}

/**
 * set a application related user attribute by user's email
 * @param appId {string} application id
 * @param email {string} user email
 * @param attrName  {string} attribute name
 * @param attrValue {string}  attribute value
 * @param done  {function} callback function(err, attr)
 */
function setAppUserAttrByEmail(appId, email, attrName, attrValue, done) {
  // find user
  findUserByEmail(email, function(err, user) {
    if (err) {
      logger.error(err.message);
      done(err);
      return;
    }

    findAppUserAttrByEmail(appId, email, attrName, function(err, attr) {
      var Attribute = models.getAppUserAttrModel(appId);
      var attribute = attr;
      if (attr == null) {
        attribute = new Attribute({
          userId: user._id,
          email: email,
          name: attrName,
          value: attrValue
        });
      } else {
        attribute.value = attrValue;
      }

      attribute.save(function(err){
        if (err) {
          logger.error(err.message);
          done(err);
          return;
        }

        done(null, attribute);
      })
    });
  })
}

/**
 * find all the app-user-attr by user's email
 * @param appId {string} application id
 * @param email {string} user email
 * @param attrName  {string} attribute name
 * @param done  {function} callback function(err, attr)
 */
function findAppUserAttrByEmail(appId, email, attrName, done) {
  var Attribute = models.getAppUserAttrModel(appId);
  Attribute.find({'email':email, 'name': attrName}, function(err, attrs){
    if (err) {
      logger.error(err.message);
      done(err);
      return;
    }

    if (attrs.length==0) {
      logger.error('Not found');
      done(new Error('Not found'));
      return;
    }

    done(null, attrs[0]);
  });
}

/**
 * remove app-user-attr  by user email
 * @param appId {string} application id
 * @param email {string} user email
 * @param attrName  {string} attribute name
 * @param done  {function} callback function(err)
 */
function removeAppUserAttrByEmail(appId, email, attrName, done) {
  var Attribute = models.getAppUserAttrModel(appId);
  Attribute.find({'email': email, 'name': attrName}).remove(done);
}

/**
 * find app-user-attr  by user email
 * @param appId {string} application id
 * @param email {string} user email
 * @param done  {function} callback function(err, attrs)
 */
function findAllAppUserAttrByEmail(appId, email, done) {
  var Attribute = models.getAppUserAttrModel(appId);
  Attribute.find({'email': email}, function(err, attrs) {
    if (err) {
      logger.error(err.message);
      return done(err);
    }

    done(null, attrs);
  });
}

/**
 * find user by user attribute
 * @param attrName  {string} attribute name
 * @param attrValue {string} attribute value
 * @param done  {function} callback function(err, users)
 */
function findUserByAttr(attrName, attrValue, done) {
  User.find({'attributes':{$elemMatch: {'name': attrName, 'value': attrValue}}}, function(err, users){
    if (err) {
      logger.error(err.message);
      return done(err);
    }

    if (users == null || users.length == 0) {
      logger.warn('No user found with attribute {' + attrName + ':' + attrValue + '}');
      return done(null, []);
    }

    done(err, users);
  });
}

/**
 * find user by user attribute
 * @param attrName  {string} attribute name
 * @param attrValue {string} attribute value
 * @param done  {function} callback function(err, users)
 */
function findAppUserByAttr(appId, attrName, attrValue, done) {
  var Attribute = models.getAppUserAttrModel(appId);

  Attribute.find({'name': attrName, 'value': attrValue }, function(err, attrs) {

  })
}

module.exports = {
  startup: startup,
  close: close,
  saveUser: saveUser,
  getUserAttr: getUserAttr,
  updateUserAttr: updateUserAttr,
  findAppBySamlId: findApplicationBySamlId,
  removeUserByEmail: removeUserByEmail,
  findUserByEmail:findUserByEmail,
  findUserByAttr:findUserByAttr,
  findAppUserByAttr: findAppUserByAttr,
  setAppUserAttrByEmail: setAppUserAttrByEmail,
  findAppUserAttrByEmail: findAppUserAttrByEmail,
  removeAppUserAttrByEmail: removeAppUserAttrByEmail,
  findAllAppUserAttrByEmail: findAllAppUserAttrByEmail
}