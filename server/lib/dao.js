/**
 * Created by BHOU on 6/20/14.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var passport = require('passport');
var bcrypt = require('bcrypt');

var Application = new Schema({
  token: {type: ObjectId, required: true},
  samlId: {type: String, index: true, required: true, unique: true},
  postUrl: {type: String, required: false}
}, {collection: 'application'});

var Attribute = new Schema({
  name: String,
  value: String
});

var UserSchema = Schema({
  name: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  salt: {type: String, required: true},
  hash: {type: String, required: true},
  valid: {type: Boolean, default: false},
  role: {type: String, default: 'user'},
  attributes: [Attribute]
}, { collection : 'user' });

UserSchema.methods.setPassword = function (password, done){
  var that = this;
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      that.hash = hash;
      that.salt = salt;
      done(that);
    });
  });
};

UserSchema.method('verifyPassword', function(password, callback) {
  bcrypt.compare(password, this.hash, callback);
});

UserSchema.static('authenticate', function(email, password, callback) {
  this.findOne({ email: email }, function(err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback(null, false);
    }

    user.verifyPassword(password, function(err, passwordCorrect) {
      if (err) {
        return callback(err);
      }
      if (!passwordCorrect) {
        return callback(null, false);
      }

      return callback(null, user);
    });
  });
});

UserSchema.statics.ADMIN = 'admin';
UserSchema.statics.USER = 'user';
UserSchema.statics.APP = 'app';

module.exports = {
  User: mongoose.model('User', UserSchema),
  Attribute: mongoose.model('Attribute', Attribute),
  Application: mongoose.model('Application', Application)
}