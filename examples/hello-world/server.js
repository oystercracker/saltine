'use strict';

const skill            = require('./index'),
      express          = require('express'),
      bodyParser       = require('body-parser'),
      app              = express();

app.use(bodyParser.json());

app.post('/', skill.express());

app.listen(3000, () => console.log('Hello world skill listening on port 3000!')); // eslint-disable-line no-console

