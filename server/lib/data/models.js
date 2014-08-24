/**
 * Created by BHOU on 8/4/2014.
 * @module lib/data/models
 */

var schemas = require('./schemas');
var ModelManager = require('./ModelManager');
var modelManager = new ModelManager();

// schemas
var Application = schemas.Application;
var User = schemas.User;
var UserAttribute = schemas.UserAttribute;
var AppUserAttribute = schemas.AppUserAttribute;

// schema names
var APP_KEY = 'APP';
var USER_KEY = 'USER';
var USER_ATTR_KEY = 'USER_ATTR';
var APP_USER_ATTR_KEY = 'APP_USER_ATTR';

// instance names
var MAIN_INSTANCE_KEY = 'MAIN';

// add schemas
modelManager.addSchema(APP_KEY, Application);
modelManager.addSchema(USER_KEY, User);
modelManager.addSchema(USER_ATTR_KEY, UserAttribute);
modelManager.addSchema(APP_USER_ATTR_KEY, AppUserAttribute);

/**
 * get app-user-attr db model
 * @param appId {string} application id
 * @returns {object} app-user-attr model
 */
function getAppUserAttrModel(appId) {
  return modelManager.getModel(APP_USER_ATTR_KEY, appId);
}

module.exports = {
  Application: modelManager.getModel(APP_KEY, MAIN_INSTANCE_KEY),
  User: modelManager.getModel(USER_KEY, MAIN_INSTANCE_KEY),
  Attribute: modelManager.getModel(USER_ATTR_KEY, MAIN_INSTANCE_KEY),

  getAppUserAttrModel: getAppUserAttrModel
}
