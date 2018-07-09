'use strict';

const { Handler, Skill } = require('saltene');

const express         = require('express'),
      bodyParser      = require('body-parser'),
      app             = express(),
    { floor, random } = Math;

const facts = [
  'A year on Mercury is just 88 days long.',
  'Despite being farther from the Sun, Venus experiences higher temperatures than Mercury.',
  'Venus rotates counter-clockwise, possibly because of a collision in the past with an asteroid.'
];

class FooHandler extends Handler {
  '?'(){
    this.say('Ha ha ha!  Check this package out!');
  }
}

class DefaultHandler extends Handler {
  LaunchRequest() {
    this.set('action', 'TellMeSomething');
  }
  TellMeSomething() {
    const factIndex  = floor(random() * facts.length),
          randomFact = facts[factIndex];
    this.say(`Okay, you want a ${this.get('request.slots.thing')}?`);
    this.say(randomFact);
    this.transitionTo('foo', 'Bar');
  }
  'AMAZON.HelpIntent'() {
    this.say('Simply ask me a for a fact, and I will give you one.');
  }
  'AMAZON.StopIntent,AMAZON.CancelIntent'() {
    // A handler function can match multiple actions.
    this.say('So long.');
  }
  '?'(){
    // a catch-all action when nothing else matches
    this.say('I\'m not sure how to help you with that.');
  }
}

function route(req, res){
  Skill.create()
    .registerHandler(DefaultHandler)
    .registerHandler('foo', FooHandler)
    .express(req, res);  // A request body object from Alexa, Google Assistant, or Cortana.
}

app.use(bodyParser.json());

app.get('/',  route);
app.post('/', route);

app.listen(3000, () => console.log('Example app listening on port 3000!'));

