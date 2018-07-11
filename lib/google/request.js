'use strict';

const Request    = require('../request'),
      BaseObject = require('../base-object'),
    { parse }    = JSON;

class GoogleRequest extends Request {
  constructor(originalRequest){
    super(...arguments);
    this.set('originalRequest', originalRequest);
    this.set('originalActionsRequest', originalRequest.originalDetectIntentRequest || originalRequest)
  }
  get platform(){
    return 'google';
  }
  get isNew(){
    return this.get('originalActionsRequest.conversation.type') === 'NEW';
  }
  get userId(){
    return this.get('originalActionsRequest.user.user_id');
  }
  get userFirstName(){
    return this.get('originalActionsRequest.user.profile.given_name');
  }
  get userSurname(){
    return this.get('originalActionsRequest.user.profile.family_name');
  }
  get userDisplayName(){
    return this.get('originalActionsRequest.user.profile.display_name');
  }
  get sessionId(){
    return this.get('originalActionsRequest.conversation.conversation_id');
  }
  /**
   * Derive sessionAttributes from "context".
   * @private
   */
  get sessionAttributes(){
    const context = this.get('originalRequest.queryResult.outputContexts', [])
                        .find(c => (c.name || '').match(/\/contexts\/sessionattributes$/i)),
          json    = BaseObject.create(context || {}).get('parameters.sessionAttributes', '{}');
    try {
      return parse(json);
    } catch(err) {
      return {};
    }
  }
  get attributes(){
    return this.get('sessionAttributes.ATTRIBUTES', {});
  }
  get state(){
    return this.get('sessionAttributes.STATE', '');
  }
  get locale(){
    // according to: https://github.com/actions-on-google/actions-on-google-nodejs/blob/ef01c100c4c9e2c95744842c4238127e1417262d/assistant-app.js#L1431-L1448
    return this.get('originalActionsRequest.user.locale') || this.super();
  }
  /**
   * The Google Actions project ID.
   * @private
   */
  get projectId(){
    return (this.get('originalRequest.session', '').match(/projects\/([\w+|\-]+)\//) || [])[1];
  }
}

module.exports = GoogleRequest;

