'use strict';

const BaseObject  = require('./base-object'),
      Handler     = require('./handler'),
      Context     = require('./context'),
    { assign }    = Object,
    { parse,
      stringify } = JSON;

/**
 * Runs the application code in the context of the request.
 * @class
 * @extends BaseObject
 * @param {object} config - Configuration that gets passed to handler action functions.
 * @property currentHandler {function} - Returns the current handler.  Defers to the default handler if the state is undefined.
*/
class Skill extends BaseObject {
  constructor(config){
    super();
    this.set('config', config);
    this.set('handlers', {});
  }
  /**
   * Registers a single handler with a state.
   * @method
   * @param {string} stateName - The state name to register the handler under.
   * @param {object} handler   - A single handler object.
   * @returns {this}
   * @example
   * skill.registerHandler('some state', SomeHandler);
  */
  registerHandler(stateName, handler){
    if(!handler && typeof stateName === 'function') {
      handler   = stateName
      stateName = undefined;
    }
    this.registerHandlers(handler.create(stateName));
    return this;
  }
  /**
   * Registers handler instances.
   * @method
   * @param {object} handlers - One or more handler instances.
   * @returns {this}
   * @example
   * skill.registerHandlers(SomeHandler.create('start'), AudioHandler.create('player'));
  */
  registerHandlers(...handlers){
    const registeredHandlers = this.get('handlers');
    handlers.forEach(handler => {
      const stateName = handler.get('stateName');
      registeredHandlers[stateName] = handler;
    });
    return this;
  }
  /**
   * Returns a handler for the given state.  Will return a null handler if nothing matches.
   * @method
   * @private
   * @returns {Handler}
  */
  handlerForState(state){
    // in case the state somehow manages to be zero or null,
    // we will convert that to undefined so that a falsey
    // state value will always return the default handler,
    // which is stored under the 'undefined' key
    return this.get('handlers')[state || undefined] || Handler.create();
  }
  /**
   * Executes the handler for the current state.  The action executed in the handler may navigate to a new state or action.
   * @method
   * @private
  */
  async handleAction(context){
    const actionName     = context.get('action'),
          handler        = this.handlerForState(context.get('state')),
          actionFunction = handler.getActionFunction(actionName) || function(){},
          config         = this.get('config', {});
    return actionFunction.bind(context)(config);
  }
  /**
   * Executes the application code within the given context and returns a promise.  The promise will resolve only once the final state is reached.
   * It is essentially the "runloop" of the application.
   * @method
   * @param   {object}    context - A response body or an instance of Context within which the application code will run.
   * @param   {object={}} payload - Extra data to be passed to the handler.
   * @returns {Promise}           - Resolves an instance of a Response subclass.  Use this to generate response JSON or implement your own vendor-specific features. 
  */
  async perform(body, payload={}){
    const context = Context.from(body);
    try {
      if(!body) throw new Error('A context body was expected by perform() but is missing.');
      await this.handleAction(context, payload);
      if(context.get('willTransition')){
        context.clean();
        return this.perform(context);
      }
      return context.get('response');      
    } catch(err) {
      const error = new Error(err);
      error.response = context.get('response');
      throw error;
    }
  }
  /**
   * Returns a function that handles an Express.js request, passing the right data to this.perform().
   * Your Express.js application *must* use the body-parser module to parse JSON bodies.
   * If you do not use body-parser with your Express.js application, the Saltine application
   * will have no JSON payload to use.
   * @method
   * @returns {Promise}
   */
  express(){
    return async (request, response) => {
      if(!request) throw new Error('A request object was expected but is missing.');
      let { body, headers } = request;
      if(!body) throw new Error('Request object does not have a body.');
      if(typeof body === 'string') body = parse(body);
      if(!headers) headers = {};
      return this.perform(body, headers)
                 .then(res => { return response.send(res.json), res; });
    };
  }
  /**
   * Returns a function that handles an AWS Lambda execution, passing the right data to this.perform().
   * @method
   * @returns {Promise}
   */
  lambda(){
    return async (event, context, callback) => {
      if(!event)    throw new Error('A Lambda event object was expected but is missing.');
      if(!callback) throw new Error('A Lambda callback funciton was expected but is missing.');
      return this.perform(event, context)
                 .then(res => callback(res.json));
    };
  }
  /**
   * Returns a function that handles an OpenWhisk execution, passing the right data to this.perform().
   * @method
   * @returns {Promise}
   */
  whisk(){
    return async (msg) => {
      if(!msg) throw new Error('An OpenWhisk message object was expected but is missing.');
      return this.perform(msg)
                 .then(res => {
                   return {
                     statusCode: 200,
                     headers: { 'Content-Type': 'application/json' },
                     body: new Buffer(stringify(res)).toString('base64')
                   }
                 });
    };
  }
}

module.exports = Skill;

