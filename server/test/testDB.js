/**
 * Created by BHOU on 8/10/2014.
 */
var Logger = require('../lib/utils/Logger');
var logger = new Logger('testDB');

var config = require('../config');
var assert = require('assert');
var db = require('../lib/data/db');
var models = require('../lib/data/models');

var bluemixContext = require('../lib/bluemixContext');

var conn = bluemixContext.getConn();
db.startup(conn);

function done(err) {
  console.log(err);
}

module.exports = {
  beforeEach: function (done) {
    db.removeUserByEmail('test@test.com', function (err) {
      if (err) {
        logger.error(err.message);
      }

      logger.info('successfully delete user');
      done();
    });
  },

  'db': {
    '#saveUser': {
      'should create a user': function (done) {
        db.saveUser({
          email: 'test@test.com',
          name: 'testUser',
          password: '123456789'
        }, function (err, user) {
          try {
            assert.notEqual(user, null);
            assert.equal(user.name, 'testUser');
            done();
          } catch (err) {
            done(err);
          }
        });
      }
    },

    '#findUserByAttr': {
      'should find user by its attr': function (done) {
        db.saveUser({
          email: 'test@test.com',
          name: 'testUser',
          password: '123456789'
        }, function (err, user) {
          db.updateUserAttr(user._id, 'testAttrName.findUserByAttr', 'testAttrValue.findUserByAttr', function (err, user, attr) {
            if (err) {
              done(err);
            }
            db.findUserByAttr('testAttrName.findUserByAttr', 'testAttrValue.findUserByAttr', function (err, users) {
              if (err) {
                done(err);
              }
              assert.equal(users.length, 1);
              assert.equal(users[0].name, 'testUser');
              assert.equal(users[0].email, 'test@test.com');
              done();
            });
          });
        });
      },

      'should not find user by its attr': function (done) {
        db.saveUser({
          email: 'test@test.com',
          name: 'testUser',
          password: '123456789'
        }, function (err, user) {
          db.findUserByAttr('testAttrName.findUserByAttr', 'testAttrValue.findUserByAttr', function (err, users) {
            if (err) {
              done(err);
            }
            assert.equal(users.length, 0);
            done();
          });
        });
      }
    },

    '#findUserByEmail': {
      'should find user': function (done) {
        db.saveUser({
          email: 'test@test.com',
          name: 'testUser',
          password: '123456789'
        }, function (err, user) {
          db.findUserByEmail('test@test.com', function (err, u) {
            try {
              assert.notEqual(u, null);
              assert.equal(u.name, 'testUser');
              done();
            } catch (err) {
              done(err);
            }
          });
        });
      }
    },

    '#updateUserAttr': {
      'should find user attr': function (done) {
        // create the user
        db.saveUser({
          email: 'test@test.com',
          name: 'testUser',
          password: '123456789'
        }, function (err, user) {
          db.updateUserAttr(user._id, 'testAttr', 'testValue', function (err, user, attr) {
            try {
              assert.notEqual(attr, null);
              assert.equal(attr.name, 'testAttr');
              assert.equal(attr.value, 'testValue');
              done();
            } catch (err) {
              done(err);
            }
          })
        });
      }
    },

    '#setAppUserAttribute': {
      'should create app user attribute': function (done) {
        db.saveUser({
          email: 'test@test.com',
          name: 'testUser',
          password: '123456789'
        }, function (err, user) {
          db.removeAppUserAttrByEmail('testAppId', 'test@test.com', 'testAttrKey', function (err) {
            db.setAppUserAttrByEmail('testAppId', 'test@test.com', 'testAttrKey', 'testAttrValue', function (err, attr) {
              try {
                assert.notEqual(attr, null);
                assert.equal(attr.email, 'test@test.com');
                assert.equal(attr.name, 'testAttrKey');
                assert.equal(attr.value, 'testAttrValue');
                done();
              } catch (err) {
                done(err);
              }
            });
          });
        });
      },

      'should set app user attribute': function (done) {
        db.saveUser({
          email: 'test@test.com',
          name: 'testUser',
          password: '123456789'
        }, function (err, user) {
          db.setAppUserAttrByEmail('testAppId', 'test@test.com', 'testAttrKey', 'testAttrValue1', function (err, attr) {
            try {
              assert.notEqual(attr, null);
              assert.equal(attr.email, 'test@test.com');
              assert.equal(attr.name, 'testAttrKey');
              assert.equal(attr.value, 'testAttrValue1');
              done();
            } catch (err) {
              done(err);
            }
          });
        });
      }
    }
  }
}
