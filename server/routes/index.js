/*
 * GET home page.
 */

var config = require('../config');

exports.index = function (req, res) {
  res.render('index', { active: 'home', title: 'Express' });
};