'use strict';

module.exports = {
  requests: {
    alexa:   require('./alexa/request'),
    google:  require('./google/request'),
    cortana: require('./cortana/request')
  },
  responses: {
    alexa:   require('./alexa/response'),
    google:  require('./google/response'),
    cortana: require('./cortana/response')
  }
};

