'use strict';

const BaseObject = require('./base-object'),
    { entries }  = Object;

/**
 * Defines behavior for a given state.
 * Every method defined in a subclass handles an "action", which can be a type, an intent, or possibly other aspects of a request.
 * When the method gets called, it gets bound to the current Context instance, meaning that `this` will return the context.
 * @class
 * @extends BaseObject
 * @param {string} stateName - The name of the state to be handled.
 */
class Handler extends BaseObject {
  constructor(stateName){
    super();
    this.set('stateName', stateName);
  }
  /**
   * Returns a new handler object with optional mixins.
   * @method
   * @example
   * Handler.create('some state', SomeMixin, AnotherMixin);
  */
  static create(...args){
    const stateName = args.filter(arg => typeof arg === 'string')[0],
          mixins    = args.filter(arg => typeof arg === 'object' || typeof arg === 'function'),
          klass     = mixins.length ? this.mixin(...mixins) : this;
    return new klass(stateName);
  }
  /**
   * Converts an everyday object to a Handler subclass.
   * @method
   * @example
   * let NewHandler = Handler.from({ LaunchRequest: function(){ this.say('hello world'); } });
  */
  static from(obj){
    const klass = class extends this {};
    entries(obj).forEach(pair => {
      klass.prototype[pair[0]] = pair[1];
    });
    return klass;
  }
  /**
   * Returns a handler with a name that matches the provided action name.  This allows action functions with multiple action names separated by commas.  Returns wildcard function if nothing matches. 
   * @method
   * @private
   * @param {...string} actionNames - One or more action names, the first ones taking higher precedence.
  */
  getActionFunction(){
    const actionNames = Array.from(arguments),
          methods     = this.get('methods'),
          actionName  = actionNames.find(n => methods.some(m => m.match(n)));
    return methods.filter(method => actionName ? method.match(actionName) : false)
                  .map(key => this[key])
                  .pop() || this['?'];
  }
}

module.exports = Handler;

