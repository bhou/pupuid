/**
 * Created by B.HOU on 8/21/2014.
 */

var config = require('../config');

function getHost() {
  return process.env.VCAP_APP_HOST || 'localhost';;
}

function getPort() {
  return process.env.VCAP_APP_PORT || 1337;
}

function getConn() {
  var conn = null;
  if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    conn = env['mongolab'][0].credentials.uri;
  } else {
    conn = "mongodb://" + config.mongostore.username + ":" + config.mongostore.password + "@"
      + config.mongostore.host + ":" + config.mongostore.port + "/" + config.mongostore.db;
  }

  return conn;
}

module.exports = {
  getHost: getHost,
  getPort: getPort,
  getConn: getConn
};