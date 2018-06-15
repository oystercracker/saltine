'use strict';

const BaseObject  = require('./base-object'),
      Handler     = require('./handler'),
      Context     = require('./context');

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
    let registeredHandlers = this.get('handlers');
    handlers.forEach(handler => {
      let stateName = handler.get('stateName');
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
   * This is useful if you wish to hand-build a context, or use your own custom context class.
   * @method
   * @param   {object}    context - A response body or an instance of Context within which the application code will run.
   * @param   {object={}} payload - Extra data to be passed to the handler.
   * @returns {Promise}           - Resolves an instance of a Response subclass.  Use this to generate response JSON or implement your own vendor-specific features. 
  */
  async perform(object, payload={}){
    const context = Context.from(object);
    await this.handleAction(context, payload);
    if(context.get('didTransition')){
      context.clean();
      return this.perform(context);
    }
    return context.get('response');
  }

}

module.exports = Skill;

