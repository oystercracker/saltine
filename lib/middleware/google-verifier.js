'use strict';

const verifier    = require('alexa-verifier'),
    { stringify } = JSON;

/**
 * Middleware to verify that a Google request is genuine (i.e. actually comes from a Google device).
 * @param {object} [options={}]
 * @param {string} options.projectId - The Google project ID to verify against.
 */
class GoogleVerifier {
  constructor(options={}){
    
  }
  async before(context, { signaturecertchainurl, signature }){
    if(context.get('request.platform') !== 'google') return;

    return verifier(signaturecertchainurl, signature, stringify(context.get('request.originalRequest')))
      .catch(err => {
        context.abort();
        context.set('response.statusCode', 400);
      });
  }
}

module.exports = GoogleVerifier;

