'use strict';

const table = [
  {
    saltine: ['Launch'],
    alexa:   ['LaunchRequest'],
    google:  ['actions.intent.MAIN'],
    cortana: []
  },
  {
    saltine: ['Exit'],
    alexa:   ['AMAZON.CancelIntent', 'AMAZON.StopIntent'],
    google:  ['actions.intent.CANCEL'],
    cortana: []
  },
  {
    saltine: ['SessionEnded'],
    alexa:   ['SessionEndedRequest'],
    google:  ['actions.intent.NO_INPUT'],
    cortana: []
  }
];

function toSaltineAction(actionName, platform){
  return (table.find(x => (x[platform] || []).some(i => i === actionName)) || {}).saltine[0];
}

class BuiltInActions {
  before(context){
    const saltineAction = toSaltineAction(context.get('action'), context.get('request.platform'));
    if(saltineAction) context.set('action', saltineAction);
  }
}

module.exports = {
  BuiltInActions,
  toSaltineAction
};

