'use strict';

const assert              = require('chai').assert,
    { entries }           = Object,
      Skill               = require('../../lib/skill'),
      Handler             = require('../../lib/handler'),
      AWS                 = require('aws-sdk-mock'),
      AWS_SDK             = require('aws-sdk'),
      MemoryPersistence   = require('../../lib/middleware/persistence/memory'),
      DynamoDBPersistence = require('../../lib/middleware/persistence/dynamodb'),
      S3Persistence       = require('../../lib/middleware/persistence/s3'),
      AlexaIntentRequest  = require('../mock/alexa/intent.json'),
      AlexaLaunchRequest  = require('../mock/alexa/launch.json');

AWS.setSDKInstance(AWS_SDK);

AWS._fakeDynamoDB = [];

AWS._fakeS3       = {};

AWS.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
  AWS._fakeDynamoDB.unshift(params);
  callback(null, "successfully put item in database");
});

AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
  const item = AWS._fakeDynamoDB.find(i => i.userId === params.Key.userId);
  if(!item) return callback({ code: 'ResourceNotFoundException' });
  callback(null, { Attributes: item.data });
});

AWS.mock('S3', 'putObject', (params, callback) => {
  AWS._fakeS3[params.Key] = params.Body;
  callback(null, "successfully put item in database");
});

AWS.mock('S3', 'getObject', (params, callback) => {
  const Body = AWS._fakeS3[params.Key];
  if(!Body) return callback({ code: 'NoSuchKey' });
  callback(null, { Body });
});

const middlewares = {
  memory:   MemoryPersistence,
  s3:       new S3Persistence(AWS_SDK.S3({
    params: {
      Bucket: 'test-bucket'
    }
  }), { bucket: 'test-bucket'}),
  dynamoDB: new DynamoDBPersistence(new AWS_SDK.DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
  }), { tableName: 'test-table' })
};



describe('middleware', function(){

  describe('persistence', function(){

    entries(middlewares).forEach(([ name, middleware ]) => {

      describe(name, function(){

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
          skill.use(middleware);
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
          skill.use(middleware);
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
          skill.use(middleware);
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
          skill.use(middleware);
          skill.registerHandler(TestHandler);
          skill.perform(AlexaIntentRequest)
               .then(() => skill.perform(AlexaLaunchRequest))
               .then(() => done());
        });


      });

    });

  });

});

