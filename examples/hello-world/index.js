'use strict';

const { Handler, Skill } = require('saltine'),
        express          = require('express'),
        bodyParser       = require('body-parser'),
        app              = express();

class HelloHandler extends Handler {
  '?'(){
    this.say('Hello world!');
  }
}

const skill = Skill.create().registerHandler(HelloHandler);

app.use(bodyParser.json());

app.post('/', skill.express());

app.listen(3000, () => console.log('Example skill listening on port 3000!')); // eslint-disable-line no-console

