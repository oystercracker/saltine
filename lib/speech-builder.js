'use strict';

const correctSSML = require('ssml-validator').correct,
    { isArray }   = Array,
    { keys }      = Object,
    { floor,
      random }    = Math;

const functions  = {
  say: function(value, context){
    const output = (context.get('options.customStringEval') || function(){return value;})(value, context);
    return correctSSML(output);
  },
  random: function(values, context){
    const value = values[floor(random()*values.length)];
    if(typeof value === 'string'){
      return this.say(value, context);
    } else {
      return processSelection(value, context);
    }
  },
  break: function(value){
    return `<break strength="${value}"/>`;
  },
  pause: function(value){
    return `<break time="${value}"/>`;
  },
  audio: function(value){
    return `<audio src="${value}"/>`;
  },
  locale: function(value, context){
    if(typeof value === 'string'){
      return this.say(value, context);
    } else {
      return processSelection(value, context);
    }
  }
};

function processSelection(input, context, output) {
  if(isArray(input)){
    input.forEach(value => processSelection(value, context, output));
  } else if((typeof input === 'string') || (typeof input === 'number')){
    output.push(functions['say'](input, context));
  } else if (input instanceof Object){
    keys(input).forEach(k => {
      let func;
      if(k.trim() == context.get('request.locale')){
        func = functions.locale.bind(functions);
      } else {
        func = (functions[k] || function(){}).bind(functions);
      }
      output.push(func(input[k], context));
    });
  }
  return output.filter(l => l);
}

module.exports = (input, context) => {
  if(!input) return;
  return processSelection(input, context, []);
}

