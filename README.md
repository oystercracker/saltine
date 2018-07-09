Saltine
=============

A small, nimble library for building smart-speaker applications.

## Usage

Saltine simply builds the JSON you would place in a voice activated response.  You will have to do that yourself with either something like [Express](https://expressjs.com/) or an [AWS Lambda](https://aws.amazon.com/lambda/) function.

### Example

This is a simple skill, using Express.js, that utilizes the basic Alexa intents.

```javascript
const { Handler, Skill } = require('saltine'),
        express          = require('express'),
        bodyParser       = require('body-parser'),
        app              = express();

const facts = [
  'A year on Mercury is just 88 days long.',
  'Despite being farther from the Sun, Venus experiences higher temperatures than Mercury.',
  'Venus rotates counter-clockwise, possibly because of a collision in the past with an asteroid.'
];

class DefaultHandler extends Handler {
  LaunchRequest() {
    this.set('action', 'GetNewFactIntent');
  }
  GetNewFactIntent() {
    this.say({
      random: facts
    });
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

app.use(bodyParser.json());

app.post('/', skill.express());

app.listen(3000, () => console.log('Example skill listening on port 3000!')); // eslint-disable-line no-console
```

## Status

At this moment, only speech can be written to Alexa and Google responses.  I've yet to do much development for Cortana(Bot Framework).  More features like cards are to come.

## Development

### Testing

[Mocha](https://mochajs.org) is used as the testing framework, and assertions are made using [Chai](https://chaijs.com).  Test coverage is tracked using [Istanbul](https://istanbul.js.org/).

To run the tests with coverage tracking, just run `npm run test`.

If you want to run tests without coverage, install Mocha globally by running `npm install -g mocha` and then perform tests by running `mocha --recursive`.

## License

See [License.txt](License.txt).


