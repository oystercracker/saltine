'use strict';

const BaseObject  = require('./base-object'),
      BaseArray   = require('./base-array'),
    { stringify } = JSON;

/**
 * Provides a uniform API around writing responses.
 * @class
 * @extends BaseObject
 * @property {string}  appId             - The vendor-specific ID for the voice-activated application.
 * @property {string}  sessionId         - The ID for the session/conversation.
 * @property {object}  output            - The platform-specific response object.
 * @property {object}  json              - The stringified JSON version of the `object` property.
 * @property {array}   speech            - The output speech, not including questions or reprompts.
 * @property {array}   prompts           - Speech output for questions prompting the user.
 * @property {array}   reprompts         - Speech output for when the user fails to reply to a prompt.
 * @property {array}   directives        - Holds objects like cards, audio, templates, etc.
 * @property {array}   waypoints         - Waypoints used so actions can schedule other actions and states to be yielded later.
 * @property {boolean} shouldEndSession  - Indicates if the session should end after the current execution.
 * @property {string}  state             - The current state of the session.
 * @property {object}  attributes        - The attributes of the session.
*/

class Response extends BaseObject {
  constructor(){
    super();
    this.set('speech',     new BaseArray());
    this.set('prompts',    new BaseArray());
    this.set('reprompts',  new BaseArray());
    this.set('directives', new BaseArray());
    this.set('waypoints',  new BaseArray());
    this.set('shouldEndSession', true);
  }
  toString(){
    return this.json;
  }
  get output(){
    return this.object || {};
  }
  get json(){
    return stringify(this.output, null, 2);
  }
  get sessionAttributes(){
    return {
      STATE:      this.get('state'),
      ATTRIBUTES: this.get('attributes'),
      WAYPOINTS:  this.get('waypoints')
    };
  }
}

module.exports = Response;

