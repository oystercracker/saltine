'use strict';

const assert                 = require('chai').assert,
      AlexaRequest           = require('../../lib/alexa/request'),
      AlexaMockIntentRequest = require('../mock/alexa/intent.json');

describe('request - alexa', function(){

  it('contains slot information', function(){
    const request = new AlexaRequest(AlexaMockIntentRequest);
    assert.equal(request.get('slots.TestSlot.literal'), 'testValue');
    assert.equal(request.get('slots.TestSlot.strict'),  'testResolvedValue');
  });

});

