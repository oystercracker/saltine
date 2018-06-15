'use strict';

const { keys, entries } = Object,
      { log }           = Math;

const assistants = {
  alexa: [
    'session',
    'request',
    'version'
  ],
  google: [
    'user',
    'device',
    'conversation',
    'inputs'
  ],
  cortana: [
    'type',
    'id',
    'timestamp',
    'serviceUrl',
    'channelId',
    'from',
    'conversation',
    'recipient',
    'text',
    'textFormat'
  ]
};

// Uses Bayes' theorem to make a best guess on which assistant the
// request body originates from since not all keys are guaranteed
// to be present in a request body.  This is preferable to the
// applicaiton making assumptions about the request being handled
// through HTTP, and should work 99.9% of the time.

module.exports = requestBody => {
  const scores        = {},
        trainingCount = keys(assistants).length;
  keys(assistants).forEach(assistant => {
    scores[assistant]  = 0;
    const assistantWords = assistants[assistant];
    keys(requestBody).forEach(key => {
      const s = (assistantWords.indexOf(key) > -1) ? 1 : 0.1;
      scores[assistant] += log(s / parseFloat(assistantWords.length));
    });
    scores[assistant] += log((1 || 0.1) / trainingCount);
  });
  return entries(scores).sort((a,b) => b[1] - a[1])[0].shift();
}

