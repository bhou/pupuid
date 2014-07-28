/**
 * Created by BHOU on 6/20/14.
 */

var mongoose = require('mongoose');
var	Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var dao = require('./dao');
var User = dao.User;
var Attribute = dao.Attribute;
var Application = dao.Application;

// Define local strategy for Passport
passport.use(new LocalStrategy({
    usernameField: 'email'
  },

  function(email, password, done) {
    User.authenticate(email, password, function(err, user) {
      return done(err, user);
    });
  }
));

// serialize user on login
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// deserialize user on logout
passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


function startup(db){
  mongoose.connect(db);

  mongoose.connection.on('open', function(){
    console.log('connected to db');
  });
}

function saveUser (user, callback){
  var newUser = new User ({
    name : user.name
    , email: user.email
  }).setPassword(user.password, function(newUser) {
      newUser.save(function(err, user) {
        //console.log('Name: ' + newUser.name + '\nEmail: ' + newUser.email);
        callback(err, user);
      });
    });
}

function getUserAttr(uid, name, callback) {
  User.findById(uid).exec(function(err, user){
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

function updateUserAttr(uid, name, value, callback) {
  getUserAttr(uid, name, function(err, user, attr){
    if (err) {
      return callback(err, user, attr);
    }

    if (attr != null && attr.name == name) {
      attr.value = value;
    } else {
      user.attributes.push(new Attribute({name: name, value: value}));
    }

    user.save();

    callback(err, user, attr);
  });
}

function findApplicationBySamlId(samlId, callback) {
  Application.find({samlId: samlId}, function(err, app){
    if (err) {
      return callback(err, null);
    }

    return callback(err, app);
  });
}

module.exports = {
  startup: startup,
  saveUser: saveUser,
  getUserAttr: getUserAttr,
  updateUserAttr: updateUserAttr,
  findAppBySamlId: findApplicationBySamlId
}