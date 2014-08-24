/**
 * Created by B.HOU on 8/20/2014.
 */
var Logger = require('../lib/utils/Logger');
var logger = new Logger('testAPI');

var request = require('supertest');
var assert = require('assert');

var bluemixContext = require('../lib/bluemixContext');

var serverUrl = 'http://'+bluemixContext.getHost()+':'+bluemixContext.getPort();

module.exports = {
  'beforeEach': function (done) {
    // delete app
    request(serverUrl)
      .del('/api/app')
      .set('samlId', 'testSamlId')
      .end(function (err, res) {
        if (err) {
          logger.error(err);
          return done(err);
        }
        logger.info('successfully delete application: testSamlId')
        return done();
      });
  },

  'beforeEach': function (done) {
    // delete user
    request(serverUrl)
      .del('/api/user')
      .set('app', 'pupuid.test.app')
      .set('token', 'pupuid.test.token')
      .set('email', 'test@test.com')
      .set('name', 'test user')
      .set('password', '123456')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        return done();
      });
  },

  'beforeEach': function (done) {
    request(serverUrl)
      .del('/api/user')
      .set('app', 'pupuid.test.app')
      .set('token', 'pupuid.test.token')
      .set('email', 'test@test.com')
      .set('name', 'test user')
      .set('password', '123456')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        request(serverUrl)
          .del('/api/appUserAttr')
          .set('app', 'pupuid.test.app')
          .set('email', 'test@test.com')
          .set('attrName', 'testAttrKey')
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            return done();
          })
      });
  },

  'api': {
    '#createApplication': {
      'should create new application': function (done) {
        request(serverUrl)
          .post('/api/app')
          .set('samlId', 'testSamlId')
          .set('postUrl', 'http://localhost')
          .expect(200).end(function (err, res) {
            if (err) {
              return done(err);
            }
            return done();
          });
      }
    },

    '#createUser': {
      'should create a user': function (done) {
        request(serverUrl)
          .post('/api/user')
          .set('app', 'pupuid.test.app')
          .set('token', 'pupuid.test.token')
          .set('email', 'test@test.com')
          .set('name', 'test user')
          .set('password', '123456')
          .expect(200).end(function (err, res) {
            if (err) {
              return done(err);
            }
            return done();
          });
      } // end of 'should create a user'
    },  // end of '#createUser'

    '#setUserAttr': {
      'should successfully set user attr': function (done) {
        // first create user
        request(serverUrl)
          .post('/api/user')
          .set('app', 'pupuid.test.app')
          .set('token', 'pupuid.test.token')
          .set('email', 'test@test.com')
          .set('name', 'test user')
          .set('password', '123456')
          .expect(200).end(function (err, res) {
            if (err) {
              return done(err);
            }
            // set user attr
            request(serverUrl)
              .put('/api/userAttr')
              .set('app', 'pupuid.test.app')
              .set('token', 'pupuid.test.token')
              .set('email', 'test@test.com')
              .set('name', 'testAttrKey')
              .set('value', 'testAttrValue')
              .expect(200).end(function(err, res){
                if (err) {
                  return done(err);
                }

                return done();
              });
          });
      },  // end of 'should successfully set user attr'

      'should successfully set app user attr': function (done) {
        // first create user
        request(serverUrl)
          .post('/api/user')
          .set('app', 'pupuid.test.app')
          .set('token', 'pupuid.test.token')
          .set('email', 'test@test.com')
          .set('name', 'test user')
          .set('password', '123456')
          .expect(200).end(function (err, res) {
            if (err) {
              return done(err);
            }
            // set app user attr
            request(serverUrl)
              .put('/api/appUserAttr')
              .set('app', 'pupuid.test.app')
              .set('token', 'pupuid.test.token')
              .set('email', 'test@test.com')
              .set('name', 'testAttrKey')
              .set('value', 'testAttrValue')
              .expect(200).end(function (err, res) {
                if (err) {
                  return done(err);
                }

                return done();
              });
          });
      }, // end of 'should successfully set app user attr'

      'should successfully get user attr': function (done) {
        // first create user
        request(serverUrl)
          .post('/api/user')
          .set('app', 'pupuid.test.app')
          .set('token', 'pupuid.test.token')
          .set('email', 'test@test.com')
          .set('name', 'test user')
          .set('password', '123456')
          .expect(200).end(function (err, res) {
            if (err) {
              return done(err);
            }
            // set user attr
            request(serverUrl)
              .put('/api/userAttr')
              .set('app', 'pupuid.test.app')
              .set('token', 'pupuid.test.token')
              .set('email', 'test@test.com')
              .set('name', 'testAttrKey')
              .set('value', 'testAttrValue')
              .expect(200).end(function (err, res) {
                if (err) {
                  return done(err);
                }

                request(serverUrl)
                  .get('/api/userAttr')
                  .set('app', 'pupuid.test.app')
                  .set('token', 'pupuid.test.token')
                  .set('email', 'test@test.com')
                  .set('attrName', 'testAttrKey')
                  .expect(200).end(function(err, res) {
                    if (err) {
                      return done(err);
                    }

                    result = JSON.parse(res.text);

                    assert.equal(result.code, 200);
                    assert.equal(result.message, 'testAttrValue');
                    done();
                  })
              });
          });
      }, // end of 'should successfully get app user attr'

      'should set user name': function(done) {
        // first create user
        request(serverUrl)
          .post('/api/user')
          .set('app', 'pupuid.test.app')
          .set('token', 'pupuid.test.token')
          .set('email', 'test@test.com')
          .set('name', 'test user')
          .set('password', '123456')
          .expect(200).end(function (err, res) {
            if (err) {
              return done(err);
            }
            // set user attr
            request(serverUrl)
              .put('/api/userAttr')
              .set('app', 'pupuid.test.app')
              .set('token', 'pupuid.test.token')
              .set('email', 'test@test.com')
              .set('name', 'name')
              .set('value', 'new user name')
              .expect(200).end(function (err, res2) {
                if (err) {
                  return done(err);
                }

                var result = JSON.parse(res2.text);
                assert.equal(result.message.name, 'new user name');
                done();
              });
          });
      }
    }, // end of '#setUserAttr'

    '#getUserInfo': {
      'should get user information': function(done) {
        request(serverUrl)
          .post('/api/user')
          .set('app', 'pupuid.test.app')
          .set('token', 'pupuid.test.token')
          .set('email', 'test@test.com')
          .set('name', 'test user')
          .set('password', '123456')
          .expect(200).end(function (err, res) {
            if (err) {
              return done(err);
            }

            // set user attr
            request(serverUrl)
              .put('/api/userAttr')
              .set('app', 'pupuid.test.app')
              .set('token', 'pupuid.test.token')
              .set('email', 'test@test.com')
              .set('name', 'testAttrKey')
              .set('value', 'testAttrValue')
              .expect(200).end(function(err, res){
                if (err) {
                  return done(err);
                }

                request(serverUrl)
                  .get('/api/userInfo')
                  .set('app', 'pupuid.test.app')
                  .set('token', 'pupuid.test.token')
                  .set('email', 'test@test.com')
                  .expect(200).end(function(err, res){
                    if (err) {
                      return done(err);
                    }

                    var result = JSON.parse(res.text);
                    assert.equal(result.message.name, 'test user');
                    assert.equal(result.message.email, 'test@test.com');
                    assert.ok(result.message.attributes.length > 1);
                    return done();
                  })
              });

          });
      }
    }
  }
}