'use strict';

const detectPlatform  = require('./platform-detector'),
      BaseObject      = require('./base-object'),
      BaseArray       = require('./base-array'),
    { requests,
      responses }     = require('./platformware'),
      speak           = require('./speech-builder'),
    { assign }        = Object;

/**
 * Represents the context of the overall applications state, including the request, response, current state, etc.  It is also used as the public interface to build the response object.
 * @class
 * @extends BaseObject
 * @property {string}   platform  - The name of the virtual platform platform detected in the request.
 * @property {Request}  request    - A platform-specific request object that the application will read from.
 * @property {Response} response   - A platform-specific response object that the application will write to.
 * @property {string}   action     - An alias to response.action, which determines the current action function to execute.  Value is initially derived from the request.
 * @property {string}   state      - An alias to response.state, which determines that current state handler to use.  Value is initially derived from the request.  Gets stored by persistence middleware in cases where it needs to be recoverd.
 * @property {object}   attributes - An alias to response.attributes, which is an object holding key/value pairs useful for the current session.  Gets stored by persistence middleware in cases where it needs to be recoverd.
 * @property {object}   storage    - An object that is persisted across sessions if persistence middleware is used.  Good for storing user data long-term.
 * @property {object}   temp       - Values that only exist for the current request.  It is not added to the response and does not get persisted.
 * @property {object}   slots      - An alias to request.slots, which holds slot values determined by user input when they've made an Intent request.
 * @property {boolean}  willTransition   - Indicates if the application has been set to transition to a different state or action.  Is used internally for the runloop to be continued or halted.
 * @property {boolean}  shouldTransition - Similar to willTransition, but should be toggled if an application uses a separate means of tracking state, thus it becomes necessary to tell the runloop to continue.
 * @property {boolean}  hasSavedSession  - Indicates if session data is available.
 * @property {object}   savedSessionData - Session data that has been persisted and recovered by persistence middleware.
*/
class Context extends BaseObject {
  /**
   * Returns a Context instance from a provided object.  
   * An existing Context will just be returned.  
   * A request object will create a new Context instance.
   * @method
   * @private
   * @returns {Context}
  */
  static from(object){
    if(object instanceof this) return object;
    return new this(...arguments);
  }
  constructor(requestObject){
    super();
    const platform = detectPlatform(requestObject);
    this.set('platform',   platform);
    this.set('request',    new requests[platform](requestObject));
    this.set('response',   new responses[platform]());
    this.set('storage',    {});
    this.set('temp',       {});
    this.loadRequest();
    this.clean();
  }
  get action(){
    return this.get('response.action');
  }
  set action(value){
    return this.set('response.action', value);
  }
  get state(){
    return this.get('response.state');
  }
  set state(value){
    return this.set('response.state', value);
  }
  get attributes(){
    return this.get('response.attributes');
  }
  set attributes(value){
    return this.set('response.attributes', value);
  }
  get slots(){
    return this.get('request.slots');
  }
  get waypoints(){
    return this.get('response.waypoints');
  }
  set waypoints(value){
    return this.set('response.waypoints', value);
  }
  get hasSavedSession(){
    return this.get('savedSessionData') ? true : false;
  }
  get hasWaypoint(){
    return this.get('waypoints', []).length ? true : false;
  }
  /**
   * Indicates if the state has changed.  It will return true if either the `state` property or the `action` property have changed.
   * It will also return true if the property `shouldTransition` is manually set to true; this property is useful if you have written
   * an application that maintains its own form of state, thus you would set `shouldTransition` to true in order to allow the
   * runloop to continue.
   * @property willTransition
   * @private
   * @returns {boolean}
  */
  get willTransition(){
    return this.get('shouldTransition') ? true : false;
  }
  /**
   * Erases record of property changes, and resets transitioning.
   * @method
   * @private
  */
  clean(){
    this.set('shouldTransition', false);
  }
  /**
   * Same as BaseObject.prototype.set, but sets `shouldTransition` to true if
   * state or action are the keys being set.
   * @param {string} key
   * @param {*}      value
   */
  set(...args){
    const key = args[0];
    if(key === 'state' || key === 'action') this.set('shouldTransition', true);
    super.set(...args);
  }
  /**
   * Gets and sets session attributes.
   * @param {string} name 
   * @param {*} value 
   */
  attr(name, value){
    if(name && value) return this.set(`response.attributes.${name}`, value), value;
    if(name)          return this.get(`response.attributes.${name}`);
  }
  /**
   * Changes the state to the specified action and/or handler.
   */
  transitionTo(options={}){
    if(!options) return;
    if(options.hasOwnProperty('state'))  this.set('state',  options.state);
    if(options.hasOwnProperty('action')) this.set('action', options.action);
  }
  /**
   * Adds a waypoint to the response.
   * This allows the application to schedule navigation for later.
   * For instance, let's say the application has a state handler that represents
   * the main story for an interactive fiction game, and the player navigates to
   * another state handler which momentarily branches off of the main story.  This function
   * can set the main story as a "waypoint" so that, when the handler for the branch finishes,
   * it will use the waypoint to know that it should return back to the main story.
   * Multiple waypoints can be set, but we aware of the potential limits imposed on
   * how much data can be put into an application response.
   */
  addWaypoint(options={}){
    if(typeof options !== 'object') throw new Error(`addWaypoint expected an object but got a ${typeof options}`);
    const state  = options.hasOwnProperty('state')  ? options.state  : this.get('state'),
          action = options.hasOwnProperty('action') ? options.action : this.get('action');
    this.get('waypoints').push([ state, action ]);
  }
  /**
   * Transitions to the last waypoint set, if there is one.
   */
  yield(){
    if(!this.get('hasWaypoint')) return;
    const [state, action] = this.get('waypoints').pop();
    this.transitionTo({ state, action });
  }
  /**
   * Removes all set waypoints.
   */
  clearWaypoints(){
    this.set('response.waypoints', new BaseArray());
  }
  /**
   * Recovers the state of the session based on persisted data added to the savedSessionData property.
   * This is particularly useful if a user prematurely exits in the middle of a session or if there is a
   * service interruption, and the developer wants to give the user a chance to resume where they left off.
   * 
   * Because this function works by reloading a persisted request object, that means that everything from
   * the last received request, including slots, will be reused.
   * @method
   * @returns {boolean} - If there was saved session data to recover, `true` will be returned.  Else, false.
   */
  loadSavedState(){
    if(!this.get('hasSavedSession')) return false;
    this.set('request', new requests[platform](this.get('savedSessionData')));
    this.loadRequest();
    delete this.savedSessionData;
    return true;
  }
  /**
   * Loads session data from request.
   * @method
   * @private
   */
  loadRequest(){
    const request  = this.get('request'),
          platform = this.get('platform');
    if(!request || !platform) return;
    this.set('action',             request.get('action'));
    this.set('state',              request.get('state'));
    this.set('attributes',         request.get('attributes', {}));
    this.set('waypoints',          request.get('waypoints', new BaseArray()));
  }
  /**
   * Writes speech to the response object.
   * @method
   * @param {object} speech - A string or object structure of speech.
   * @example
   * // You can provide a string:
   * context.say('Hello world');
   * // Or you can specify different strings for locales
   * context.say({
   *   'en-US': 'hello world',
   *   'de-DE': 'hallo welt'  
   * });
   * // Or an array of either objects or strings (to be concatenated)
   * context.say([
   *   'Hello!',
   *   {
   *      'en-US': 'goodbye',
   *      'de-DE': 'auf wiedersehen'
   *   }
   * ]);
   * // You can also add pauses and audio
   * context.say([
   *   {audio: 'https://example.net/sound.mp3'},
   *   {pause: '2s'},
   *   'Oh, sorry, I thought we were done speaking.'
   * ]);
  */
  say(speech){
    const ssml         = speak(speech, this),
          outputSpeech = this.get('response.speech', new BaseArray());
    outputSpeech.push.apply(outputSpeech, ssml);
  }
  /**
   * Writes speech meant to represent a question to the user and prevents the session from being ended.
   * @method
   * @param {object} speech - A string or object structure of speech.
  */
  ask(speech){
    const ssml       = speak(speech, this),
        outputSpeech = this.get('response.prompts', new BaseArray());
    outputSpeech.push.apply(outputSpeech, ssml);
    this.set('response.shouldEndSession', false);
  }
  /**
   * Writes speech to be used when a user fails to reply to a question/prompt.
   * @method
   * @param {object} speech - A string or object structure of speech.
  */
  reprompt(speech){
    const ssml         = speak(speech, this),
          outputSpeech = this.get('response.reprompt', new BaseArray());
    outputSpeech.push.apply(outputSpeech, ssml);
  }
  /**
   * Adds a basic card to the response.
   * @method
   * @param {object} params - A card object.
  */
  card(params={}){
    const card = {
      type: 'card',
      options: params
    }
    this.addDirective(card);
  }
  /**
   * Adds an audio directive to the response.
   * @method
   * @param {object|string} params - A string or a params object describing the audio directive.
  */
  audio(params={}){
    const audio = {
      type: 'audio',
      options: {}
    };
    if(params === 'stop'){
      audio.options.type = 'stop';
    }
    if(params === 'clear enqueued'){
      audio.options.type     = 'clear';
      audio.options.behavior = params;
    }
    if(params === 'clear all' || params === 'clear'){
      audio.options.type = 'clear';
      audio.options.behavior = 'clear all';
    }
    if(typeof params === 'string'){
      audio.options.type     = 'play';
      audio.options.behavior = 'replace all';
      audio.options.url      = params;
      audio.options.token    = params;
      audio.options.offset   = 0;
    }
    if(typeof params === 'object') assign(audio.options, params);
    this.addDirective(audio);
  }
  /**
   * Adds a basic card to the response.
   * @method
   * @private
   * @param {object} directive - A directive object.
  */
  addDirective(directive={}){
    this.get('response.directives').push(directive);
  }
}

module.exports = Context;

