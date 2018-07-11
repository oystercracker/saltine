'use strict';

const Response    = require('../response'),
    { stringify } = JSON;

class GoogleResponse extends Response {
  get output() {
    // Dialogflow v2 webhook response
    const output = {
      fulfillmentText: this.outputSpeech, // ASCII characters only
      payload: {
        google: {
          expectUserResponse: true,
          richResponse: [
            {
              simpleResponse: {
                ssml: this.outputSpeech
              }
            }
          ]
        }
      },
      outputContexts: [
        {
          name:          `projects/helloworld-75cc0/agent/sessions/${this.get('sessionId')}/contexts/sessionAttributes`,
          lifespanCount: 10000,
          parameters:    {
            sessionAttributes: stringify(this.get('sessionAttributes', {}))
          }
        }
      ]
    };

    return output;

    if(!this.get('prompts.length')) return output;

    const noInputPrompts = [];
    noInputPrompts = [];
    this.get('reprompts', [this.get('prompts.last')]).forEach(p => {
      noInputPrompts.push({
        ssml: `<speak>${p}</speak>`
      });
    });
    output.payload.google.noInputPrompts = noInputPrompts;

    return output;

  }

  get outputSpeech(){
    return ['<speak>'].concat(this.get('speech', [])).concat(this.get('prompts', [])).concat(['</speak>']).join('\n');
  }


}

module.exports = GoogleResponse;

