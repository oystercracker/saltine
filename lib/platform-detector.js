'use strict';

const { keys, entries } = Object,
      { log }           = Math;

const platforms = {
  alexa: [
    'session',
    'request',
    'version'
  ],
  google: [
    'user',
    'device',
    'conversation',
    'inputs',
    'surface',
    'isInSandbox',
    'availableSurfaces'
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

// Uses Bayes' theorem to make a best guess on which platform the
// request body originates from since not all keys are guaranteed
// to be present in a request body.  This is preferable to the
// applicaiton making assumptions about the request being handled
// through HTTP, and should work 99.9% of the time.

module.exports = requestBody => {
  const scores        = {},
        trainingCount = keys(platforms).length;
  keys(platforms).forEach(platform => {
    scores[platform]  = 0;
    const platformWords = platforms[platform];
    keys(requestBody).forEach(key => {
      const s = (platformWords.indexOf(key) > -1) ? 1 : 0.1;
      scores[platform] += log(s / parseFloat(platformWords.length));
    });
    scores[platform] += log((1 || 0.1) / trainingCount);
  });
  return entries(scores).sort((a,b) => b[1] - a[1])[0].shift();
}

