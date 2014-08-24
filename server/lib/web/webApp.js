/**
 * web application, provide web interface
 * Created by B.HOU on 8/19/2014.
 */

var idp = require('../../routes/idp');
var routes = require('../../routes');
var user = require('../../routes/user');

function init(app) {
  app.get('/', routes.index);
  app.get('/users', user.list);

  /**
   * web interface
   */
  app.get('/register', idp.register);
  app.post('/doRegister', idp.doRegister);

  app.get('/login', idp.login);
  app.post('/doLogin', idp.doLogin);

  app.get('/adminLogin', function(req, res){
    res.render('adminLogin');
  });

  app.get('/adminRegister', function(req, res){
    res.render('adminRegister');
  });

  app.get('/adminResetPwd', function(req, res){
    res.render('adminResetPwd');
  });

  app.get('/adminIndex', function(req, res){
    res.render('adminIndex');
  });

}

module.exports = {
  init: init
}