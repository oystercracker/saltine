'use strict';

const assert              = require('chai').assert,
    { BuiltInActions }    = require('../../lib/middleware/build-in-actions'),
      Context             = require('../../lib/context'),
      AlexaIntentRequest  = require('../mock/alexa/intent.json'),
      AlexaLaunchRequest  = require('../mock/alexa/launch.json');

describe('middleware', function(){
  describe('built-in actions', function(){

    it('translates Alexa launch request', function(){
      const context    = Context.from(AlexaLaunchRequest),
            middleware = new BuiltInActions();
      middleware.before(context);
      assert.equal(context.get('action'), 'Launch');
    });

    it('translates Alexa launch request', function(){
      const context    = Context.from(AlexaLaunchRequest),
            middleware = new BuiltInActions();
      middleware.before(context);
      assert.equal(context.get('action'), 'Launch');
    });

  });
});