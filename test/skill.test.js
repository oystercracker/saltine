'use strict';

const assert             = require('chai').assert,
      Skill              = require('../lib/skill'),
      Handler            = require('../lib/handler'),
      AlexaMockRequest   = require('./mock/alexa/launch.json');

describe('skill', function(){

  describe('registerHandler()', function(){
    it('registers a default handler', function(){
      const skill = new Skill(AlexaMockRequest);
      skill.registerHandler(Handler);
      const handlers = Object.values(skill.get('handlers'));
      assert.isNotEmpty(handlers);
    });
    it('registers a handler for a state', function(){
      const skill = new Skill(AlexaMockRequest);
      skill.registerHandler('some state', Handler);
      const handler = Object.values(skill.get('handlers'))[0];
      assert.equal(handler.get('stateName'), 'some state');
    });
  });

  describe('registerHandlers()', function(){
    it('populates handlers', function(){
      const skill = new Skill(AlexaMockRequest);
      skill.registerHandlers(new Handler(), new Handler('some state'));
      const handlers = Object.values(skill.get('handlers'));
      assert.isNotEmpty(handlers);
    });
  });

  describe('perform()', function(){

    it('runs registered handlers and returns a json response', function(done){
      class SomeHandler extends Handler {
        LaunchRequest(){
          this.say('hello.');
          this.set('state', 'some state');
          this.set('action', 'DoSomethingIntent');
        }
      }
      class AnotherHandler extends SomeHandler {
        DoSomethingIntent(){
          this.say('world.')
        }
      }
      const skill        = new Skill(),
          defaultHandler = new SomeHandler(),
          stateHandler   = new AnotherHandler('some state');
      skill.registerHandlers(defaultHandler, stateHandler);
      skill.perform(AlexaMockRequest)
        .then(response => {
          const json = JSON.stringify(response);
          assert.match(json, /hello/);
          assert.match(json, /world/);
          done();
        });
    });
  });

});

