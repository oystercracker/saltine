'use strict';

const Request  = require('../request'),
      Slot     = require('./slot'),
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
  get userId(){
    return this.get('originalRequest.user.userId');
  }
  get sessionId(){
    return this.get('originalRequest.session.sessionId');
  }
  // get applicationId(){
  //   return this.get('originalRequest.session.applicationId');
  // }
  get attributes(){
    // clone the attributes object so it can be modified and
    // used in the response witout altering the request
    return assign({}, this.get('originalRequest.session.attributes.ATTRIBUTES', {}));
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

