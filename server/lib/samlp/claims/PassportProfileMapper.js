//shorthands claims namespaces
var fm = {
  'nameIdentifier': 'nameIdentifier',
  'email': 'email',
  'name': 'name',
  'givenname': 'givenName',
  'surname': 'surName',
  'upn': 'upn',
  'groups': 'gourps',
  'token': 'token'
};

/**
 *
 * Passport User Profile Mapper
 *
 * A class to map passport.js user profile to a wsfed claims based identity.
 *
 * Passport Profile:
 * http://passportjs.org/guide/profile/
 *
 * Claim Types:
 * http://msdn.microsoft.com/en-us/library/microsoft.identitymodel.claims.claimtypes_members.aspx
 *
 * @param  {Object} pu Passport.js user profile
 */
function PassportProfileMapper(pu) {
  if (!(this instanceof PassportProfileMapper)) {
    return new PassportProfileMapper(pu);
  }
  this._pu = pu;
}

/**
 * map passport.js user profile to a wsfed claims based identity.
 *
 * @return {Object}    WsFederation claim identity
 */
PassportProfileMapper.prototype.getClaims = function () {
  var claims = {};

  claims[fm.nameIdentifier] = this._pu.id;
  claims[fm.email] = this._pu.email;
  claims[fm.name] = this._pu.name;
  claims[fm.givenname] = this._pu.name;
  claims[fm.surname] = this._pu.name;

  var attrs = this._pu.attributes;
  if (attrs != null && attrs.length != 0) {
    var len = attrs.length;
    for (var i = 0; i < len; i++) {
      if (attrs[i].name == 'token') {
        claims[fm.token] = attrs[i].value;
        break;
      }
    }
  }


  // var dontRemapAttributes = ['emails', 'displayName', 'name', 'id', '_json'];

  //  Object.keys(this._pu).filter(function (k) {
  //      return !~dontRemapAttributes.indexOf(k);
  //    }).forEach(function (k) {
  //      claims['http://schemas.passportjs.com/' + k] = this._pu[k];
  //    }.bind(this));

  return claims;
};

/**
 * returns the nameidentifier for the saml token.
 *
 * @return {Object} object containing a nameIdentifier property and optional nameIdentifierFormat.
 */
PassportProfileMapper.prototype.getNameIdentifier = function () {
  var claims = this.getClaims();

  return {
    nameIdentifier: claims[fm.nameIdentifier] ||
      claims[fm.name] ||
      claims[fm.emailaddress]
  };

};

/**
 * claims metadata used in the metadata endpoint.
 *
 * @param  {Object} pu Passport.js profile
 * @return {[type]}    WsFederation claim identity
 */
PassportProfileMapper.prototype.metadata = [
  {
    id: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    optional: true,
    displayName: 'E-Mail Address',
    description: 'The e-mail address of the user'
  },
  {
    id: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
    optional: true,
    displayName: 'Given Name',
    description: 'The given name of the user'
  },
  {
    id: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    optional: true,
    displayName: 'Name',
    description: 'The unique name of the user'
  },
  {
    id: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
    optional: true,
    displayName: 'Surname',
    description: 'The surname of the user'
  },
  {
    id: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
    optional: true,
    displayName: 'Name ID',
    description: 'The SAML name identifier of the user'
  },
  {
    id: "http://certifoto.com/identity/claims/token",
    optional: true,
    displayName: 'token',
    description: 'The login token of the user'
  }
];

module.exports = PassportProfileMapper;