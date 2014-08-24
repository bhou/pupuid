/**
 * saml provider app
 * Created by B.HOU on 8/19/2014.
 */

var idp = require('../../routes/idp');

function init(app) {
  app.get('/samlp', idp.redirectEndPoint);
  app.post('/samlp', idp.postEndpoint);
  app.get('/samlp/metadata.xml', idp.idpMetadata);
}

module.exports = {
  init: init
}