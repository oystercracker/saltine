'use strict';

const { Handler, Skill } = require('saltine');

const AlexaVerifier = require('../../lib/middleware/alexa-verifier');

class HelloHandler extends Handler {
  '?'(){
    this.say('Hello world!');
  }
}

module.exports = Skill.create()
                      // .use(AlexaVerifier)
                      .registerHandler(HelloHandler);

