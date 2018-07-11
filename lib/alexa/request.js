'use strict';

const Request        = require('../request'),
      Slot           = require('./slot'),
      BaseArray      = require('../base-array'),
    { assign, keys } = Object;

class AlexaRequest extends Request{
  constructor(){
    super(...arguments);
    this.slots = this.slots || {};
    const intentSlots = this.get('originalRequest.request.intent.slots', {});
    keys(intentSlots).forEach(slotName => {
      this.slots[slotName] = new Slot(intentSlots[slotName]);
    });
  }
  get platform(){
    return 'alexa';
  }
  get isNew(){
    return this.get('originalRequest.session.new') ? true : false;
  }
  get userId(){
    return this.get('originalRequest.session.user.userId')
  }
  get sessionId(){
    return this.get('originalRequest.session.sessionId');
  }
  get attributes(){
    // clone the attributes object so it can be modified and
    // used in the response witout altering the request
    return assign({}, this.get('originalRequest.session.attributes.ATTRIBUTES', {}));
  }
  get waypoints(){
    return this.get('originalRequest.session.attributes.WAYPOINTS', new BaseArray());
  }
  get state(){
    return this.get('originalRequest.session.attributes.STATE');
  }
  get locale(){
    return this.get('originalRequest.request.locale') || this.super.locale();
  }
  get action(){
    if(this.get('originalRequest.request.type') == 'IntentRequest'){
      return this.get('originalRequest.request.intent', {})['name'];
    }
    return this.get('originalRequest.request.type');
  }
}

module.exports = AlexaRequest;

