'use strict';

const verifier    = require('alexa-verifier'),
    { stringify } = JSON;

class AlexaVerifier {
  async before(context, { signaturecertchainurl, signature }){
    if(context.get('request.platform') !== 'alexa') return;
    return verifier(signaturecertchainurl, signature, stringify(context.get('request.originalRequest')))
      .catch(err => {
        context.abort();
        context.set('response.statusCode', 400);
      });
  }
}

module.exports = AlexaVerifier;

