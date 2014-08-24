/**
 * Created by BHOU on 8/4/2014.
 */
// imports
var Logger = require('./../utils/Logger');
var logger = new Logger('ModelManager');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// private instance-shared variable
var schemas = {};
var models = {};

/**
 * model manager, manages mongoose models
 * @constructor
 */
function ModelManager() {

}

/**
 * add schema to the model manager
 * @param name  the name of the schema
 * @param schema  the schema object
 */
ModelManager.prototype.addSchema = function (name, schema) {
  logger.info("Add schema %s", name);
  schemas[name] = schema;
}

/**
 * get the model with schema name and model name
 * @param schemaName
 * @param modelName
 */
ModelManager.prototype.getModel = function(schemaName, modelName) {
  logger.info("Looking for model %s of schema %s", modelName, schemaName);
  var internalModelName = schemaName + '-' + modelName;

  // create one model if not exist
  if (models[internalModelName] == null) {
    logger.warn("Could not find model: %s, auto-create it", internalModelName);
    // check if the schema exist
    var schema = schemas[schemaName];
    if (schema == null) {
      logger.error('Could not find schema: %s', schema);
      return null;
    }

    // create the model
    models[internalModelName] = mongoose.model(internalModelName, schema);

    return models[internalModelName];
  }

  logger.info("Found model %s", internalModelName);
  return models[internalModelName];
}


module.exports = ModelManager;
