'use strict';

const detectPlatform  = require('./platform-detector'),
      BaseObject      = require('./base-object'),
      BaseArray       = require('./base-array'),
      AlexaRequest    = require('./alexa/request'),
      AlexaResponse   = require('./alexa/response'),
      GoogleRequest   = require('./google/request'),
      GoogleResponse  = require('./google/response'),
      CortanaRequest  = require('./cortana/request'),
      CortanaResponse = require('./cortana/response'),
      speak           = require('./speech-builder'),
    { assign }        = Object;

/**
 * Represents the context of the overall applications state, including the request, response, current state, etc.  It is also used as the public interface to build the response object.
 * @class
 * @extends BaseObject
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
    let assistant, request, response;
    assistant = detectPlatform(requestObject);
    if(assistant == 'alexa'){
      request  = new AlexaRequest(requestObject);
      response = new AlexaResponse();
    }
    if(assistant == 'google'){
      request  = new GoogleRequest(requestObject);
      response = new GoogleResponse();
    }
    if(assistant == 'cortana'){
      request  = new CortanaRequest(requestObject);
      response = new CortanaResponse();
    }
    this.set('assistant',  assistant);
    this.set('request',    request);
    this.set('response',   response);
    this.set('action',     request.get('action'));
    this.set('state',      request.get('state'));
    this.set('attributes', request.get('attributes'));
    this.clean();
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
  /**
   * Indicates if the state has changed.  It will return true if either the `state` property or the `action` property have changed.
   * @property didTransition
   * @private
   * @returns {boolean}
  */
  get didTransition(){
    return this.get('dirty.state') || this.get('dirty.action');
  }
  /**
   * Erases record of property changes.
   * @method
   * @private
  */
  clean(){
    this.dirty = {};
  }
  set(...args){
    super.set(...args);
    this.get('dirty', {})[args[0]] = true;
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
  transitionTo(...args){
    if(args.length > 1){
      this.set('state', args[0]);
      this.set('action', args[1]);
    }
    if(args.length === 1) this.set('action', args[0]);
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

