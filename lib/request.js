'use strict';

const BaseObject = require('./base-object'),
      BaseArray  = require('./base-array'),
      stringify  = JSON;

/**
 * Provides a uniform API for handling requests from voice activated assistants.
 * @class
 * @extends BaseObject
 * @property {string}  platform       - String indicating the platform(e.g. 'alexa', 'google').   
 * @property {string}  userId         - A unique ID for the user making the request.
 * @property {string}  userFirstName  - The first name of the user making the request.
 * @property {string}  userSurname    - The surname name of the user making the request.
 * @property {string}  userDislayName - The display name of the user making the request.
 * @property {string}  sessionId      - A unique ID for the current session/conversation.
 * @property {string}  requestId      - A unique ID for the request.
 * @property {object}  attributes     - The object that stores various values and exists for the duration of a session.
 * @property {string}  locale         - The locale of the request.  If none is included, it will default to either the environment variable `DEFAULT_LOCALE` or it will return 'en-US'.
 * @property {string}  json           - A serialized JSON representation of the request.
 * @property {string}  action         - The name of the request type or the name of the intent being sent.
 * @property {boolean} isNew          - Indicates if the session is new.
 */
class Request extends BaseObject {
  static from(requestObject){
    if(requestObject instanceof this) return requestObject;
    return new this(requestObject);
  }
  constructor(originalRequest){
    super(...arguments);
    this.set('originalRequest', originalRequest);
  }
  get platform(){ return 'none'; }
  get userId(){}
  get userFirstName(){}
  get userSurname(){}
  get userDisplayName(){}
  get sessionId(){}
  get requestId(){}
  get attributes(){ return {}; }
  get state(){}
  get waypoints(){ return new BaseArray(); }
  get json(){
    return stringify(this.get('originalRequest', {}), null, 2);
  }
  get locale(){
    return process.env.DEFAULT_LOCALE || 'en-US';
  }
  get action(){}
  get isNew(){ return true; }
  toString(){
    return this.json;
  }
}

module.exports = Request;

