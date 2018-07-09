'use strict';

const assert              = require('chai').assert,
      Skill               = require('../../../lib/skill'),
      Handler             = require('../../../lib/handler'),
      AWSMock             = require('mock-aws-s3'),
      S3Persistence       = require('../../../lib/middleware/persistence/s3'),
      AlexaIntentRequest  = require('../../mock/alexa/intent.json'),
      AlexaLaunchRequest  = require('../../mock/alexa/launch.json'),
    { execSync }          = require('child_process');

describe('middleware', function(){

  describe('persistence - s3', function(){

    const bucketPath = `${__dirname}/../../../tmp/buckets`;

    AWSMock.config.basePath = bucketPath;

    after(() => execSync(`rm -rf ${bucketPath}`));

    const persistence = new S3Persistence(AWSMock.S3({
      params: {
        Bucket: 'test-bucket'
      }
    }));

    it('persists storage', function(done){
      class TestHandler extends Handler {
        FoobarIntent(){
          this.set('storage.foo', 'bar');
        }
        '?'(){
          assert.equal(this.get('storage.foo'), 'bar');
        }
      }
      const skill = Skill.create();
      skill.use(persistence);
      skill.registerHandler(TestHandler);
      skill.perform(AlexaIntentRequest)
           .then(() => skill.perform(AlexaLaunchRequest))
           .then(() => done());
    });

    it('persists session request if error present in context', function(done){
      class TestHandler extends Handler {
        FoobarIntent(){
          throw new Error('this is just a test');
        }
        '?'(){
          assert.exists(this.get('savedSessionData'));
        }
      }
      const skill = Skill.create();
      skill.use(persistence);
      skill.registerHandler(TestHandler);
      skill.perform(AlexaIntentRequest)
           .catch(() => { /* do nothing */ })
           .then(() => skill.perform(AlexaLaunchRequest))
           .then(() => done());
    });

    it('does not persist session request if no error occurred', function(done){
      class TestHandler extends Handler {
        FoobarIntent(){}
        '?'(){
          assert.notExists(this.get('savedSessionData'));
        }
      }
      const skill = Skill.create();
      skill.use(persistence);
      skill.registerHandler(TestHandler);
      skill.perform(AlexaIntentRequest)
           .then(() => skill.perform(AlexaLaunchRequest))
           .then(() => done());
    });

    it('persists session request if shouldEndSession is false', function(done){
      class TestHandler extends Handler {
        FoobarIntent(){
          this.ask('Baz');
        }
        '?'(){
          assert.exists(this.get('savedSessionData'));
        }
      }
      const skill = Skill.create();
      skill.use(persistence);
      skill.registerHandler(TestHandler);
      skill.perform(AlexaIntentRequest)
           .then(() => skill.perform(AlexaLaunchRequest))
           .then(() => done());
    });

  });

});

