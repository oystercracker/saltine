'use strict';

const BaseObject  = require('./base-object'),
      BaseArray   = require('./base-array'),
      Handler     = require('./handler'),
      Context     = require('./context'),
    { assign }    = Object,
    { parse,
      stringify } = JSON;

/**
 * Runs state handlers in the context of the request.
 * @class
 * @extends BaseObject
 * @param    {object}   config         - Configuration that gets passed to handler action functions.
 * @property {function} currentHandler - Returns the current handler.  Defers to the default handler if the state is undefined.
*/
class Skill extends BaseObject {
  constructor(config){
    super();
    this.set('config',     config);
    this.set('handlers',   {});
    this.set('middleware', new BaseArray());
  }
  /**
   * Adds middleware that gets executed in different places when a request is processed.
   * The middleware can be a simple object, or a class, or class instance that implements the functions `before` and `after`.
   * For instance, to manipulate the request object, a before function would access the Context object that is passed to it.
   * The functions implemented can optionally be asynchronous or return a Promise object.
   * @param {object|class} middlewares - One or more middlewares to be added to the application.  They will be executed in the order they are listed. 
   * @example
   * const customMiddleware = {
   *   before(context){
   *     // A simple function that retrieves user data from a remote database.
   *     const userId = context.set('request.userId');
   *     return fetch(`${endpoint}/api/users/${userId}`)
   *              .then(data => {
   *                context.set('attributes.userdata', data);
   *              });
   *   },
   *   after(context){
   *     // If no speech has been written to the response, add some default speech.
   *     const hasSpeech = context.get('response.speech.length');
   *     if(!hasSpeech) context.say('I have nothing to say.');
   *   }
   * };
   * 
   * skill.use(CustomMiddleware);
   */
  use(...middlewares){
    const middleware = this.get('middleware');
    middleware.concatObject(middlewares.map(m => {
      if(typeof m === 'function') return new m();
      return m;
    }));
    return this;
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
   * @param {Context} context - A context object.
   * @param {object}  payload - Extra information separate from the request body, such as HTTP headers.
   * @param {string}  name    - An optional action name.  If left undefined, the action name will be derived from the request in the context.
  */
  async handleAction(context, payload, name){
    const actionName     = name || context.get('action'),
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
    if(!body) throw new Error('A context body was expected by perform() but is missing.');
    const context    = Context.from(body),
          middleware = this.get('middleware'),
          execute    = async (actionName) => {
            await this.handleAction(context, payload, actionName);
            if(!context.get('willTransition')) return;
            context.set('shouldTransition', false);
            return execute();
          },
          handleError = async (error) => {
            // If an error happens, retry with the onError event action function if it exists.
            context.get('errors', []).push(error);
            // Errors should interrupt current transitioning.
            context.set('shouldTransition', false);
            const handler        = this.handlerForState(context.get('state')),
                  actionFunction = handler.getActionFunction('onError');
            // Swallow the error if there is an onError function.
            if(actionFunction) return await execute('onError');
            throw error;
          }
    context.set('skill', this);
    let ready = false;
    try {
      await Promise.all(middleware.map(m => (m.before || function(){}).apply(m, [context])));
      ready = true;
    } catch(err) {
      // If not all middlewares succeed prior to main execution, we assume the 
      // request or context is not ready, which is why we decide not to proceed.
      await handleError(err);
    }
    try {
      if(ready) await execute();
    } catch(err) {
      await handleError(err);
    }
    try {
      // We assume that even if the main execution throws an error, the middleware after()
      // methods may be important in how the application is going to construct a proper
      // response.  Middleware running after main execution may also be used to conduct
      // error reporting, hence another reason why we need to attempt to use middleware here.
      if(ready) await Promise.all(middleware.map(m => (m.after || function(){}).apply(m, [context])));
    } catch(err) {
      await handleError(err);
    }
    return context.get('response');
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

