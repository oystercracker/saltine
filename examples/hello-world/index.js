'use strict';

const { Handler, Skill } = require('saltine');

class HelloHandler extends Handler {
  '?'(){
    this.say('Hello world!');
  }
}

module.exports = Skill.create()
                      .registerHandler(HelloHandler);

