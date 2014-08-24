/**
 * Created by BHOU on 8/4/2014.
 * @class Logger
 */
var winston = require('winston');
var config = require('../../config');

/**
 * create a logger with module name
 * @param name
 * @constructor
 */
function Logger(name) {
  this.name = name;
  this.logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(
        {
          level: config.logger.level ? config.logger.level : 'info'
        })
//      new (winston.transports.File)(
//        {
//          filename: config.logger.file ? config.logger.file : 'pupuid-server.log',
//          level: config.logger.level ? config.logger.level : 'info'
//        })
    ]
  });
}

Logger.prototype.getRawLogger = function () {
  return this.logger;
}

/**
 * log info level log
 */
Logger.prototype.info = function () {
  var args = Array.prototype.slice.call(arguments);

  if (args.length > 0) {
    args[0] = '[' + this.name + '] ' + args[0];
  }

  this.logger.info.apply({}, args);
}

/**
 * log warning level log
 */
Logger.prototype.warn = function () {
  var args = Array.prototype.slice.call(arguments);

  if (args.length > 0) {
    args[0] = '[' + this.name + '] ' + args[0];
  }

  this.logger.warn.apply({}, args);
}

/**
 * log error level log
 */
Logger.prototype.error = function () {
  var args = Array.prototype.slice.call(arguments);

  if (args.length > 0) {
    args[0] = '[' + this.name + '] ' + args[0];
  }

  this.logger.error.apply({}, args);
}


module.exports = Logger;