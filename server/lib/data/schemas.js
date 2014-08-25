/**
 * Created by BHOU on 8/4/2014.
 * @module lib/data/schemas
 */

// imports
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var passport = require('passport');
var bcrypt = require('bcrypt');
var uuid = require('node-uuid');

/**
 * application schema
 * @type {Schema}
 */
var ApplicationSchema = new Schema({
  token: {type: String, required: true, default: function() {return uuid.v1();}},
  samlId: {type: String, index: true, required: true, unique: true},
  postUrl: {type: String, required: false}
});

/**
 * user attribute schema
 * @type {Schema}
 */
var AttributeSchema = new Schema({
  name: String,
  value: String
});

/**
 * app specific user attribute schema
 * @type {Schema}
 */
var AppUserAttributeSchema = new Schema({
  userId: {type: ObjectId, required: true},
  email: {type: String, required: true},
  name: String,
  value: String
});

/**
 * user schema
 * @type {Schema}
 */
var UserSchema = new Schema({
  name: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  salt: {type: String, required: true},
  hash: {type: String, required: true},
  valid: {type: Boolean, default: false},
  role: {type: String, default: 'user'},
  attributes: [AttributeSchema]
});

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


module.exports = {
  Application: ApplicationSchema,
  User: UserSchema,
  UserAttribute: AttributeSchema,
  AppUserAttribute: AppUserAttributeSchema
}