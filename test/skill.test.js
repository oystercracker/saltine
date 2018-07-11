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
          assert.match(response.json, /hello/);
          assert.match(response.json, /world/);
          done();
        });
    });

    it('calls onError event action function if error is thrown in handler', function(done){
      class SomeHandler extends Handler {
        LaunchRequest(){
          throw Error('something wrong happened');
        }
        onError(){
          assert.exists(this.get('error'));
        }
      }
      Skill.create()
           .registerHandler(SomeHandler)
           .perform(AlexaMockRequest)
           .then(() => done());
    });

    it('calls onError function if error happens in middleware before() method and halts further execution', function(done){
      class SomeMiddleware {
        before(){
          throw Error('something wrong happened');
        }
        after(context){
          context.say('nothing wrong happened');
        }
      }
      class SomeHandler extends Handler {
        LaunchRequest(){
          this.say('nothing wrong happened');
        }
        onError(){
          assert.exists(this.get('error'));
        }
      }
      Skill.create()
           .use(SomeMiddleware)
           .registerHandler(SomeHandler)
           .perform(AlexaMockRequest)
           .then(resp => {
             assert.isEmpty(resp.speech); done();
           });
    });

    it('does not complain if the handler does not have a corresponding action function', function(done){
      class SomeHandler extends Handler {}
      Skill.create()
           .registerHandler(SomeHandler)
           .perform(AlexaMockRequest)
           .then(() => done());
    });

    it('executes middleware', function(done){
      class SomeHandler extends Handler {
        LaunchRequest(){
          this.say('bar');
        }
      }
      class SomeMiddleware {
        before(context){
          context.say('foo');
        }
        after(context){
          context.say('baz');
        }
      }
      Skill.create()
           .use(SomeMiddleware)
           .registerHandler(SomeHandler)
           .perform(AlexaMockRequest)
           .then(resp => {
             assert.deepEqual(resp.speech, [ 'foo', 'bar', 'baz' ]);
             done();
           });
    });


    it('prevents execution when shouldAbort is true on the context', function(done){
      class SomeHandler extends Handler {
        '?'(){
          this.say('foo');
        }
      }
      class SomeMiddleware {
        before(context){
          context.abort();
        }
      }
      Skill.create()
           .use(SomeMiddleware)
           .registerHandler(SomeHandler)
           .perform(AlexaMockRequest)
           .then(resp => { assert.isEmpty(resp.get('speech')), done(); })
    });

  });

  describe('express()', function(){
    it('takes an Express request and writes to the given Express response', function(done){
      class SomeHandler extends Handler {
        LaunchRequest(){
          this.say('hello world');
        }
      }

      const skill    = Skill.create()
                            .registerHandler(SomeHandler)
                            .express(),
            response = {
              body: ''
            };
      
      response.status = (code) => {
        response.statusCode = code;
      }

      response.send = (text) => {
        response.body = response.body + text;
      };

      skill({body: AlexaMockRequest}, response)
        .then(resp => {
          assert.match(response.body, /<speak>hello world<\/speak>/);
          assert.equal(response.statusCode, 200);
          done();
        });

    });
  });

});

