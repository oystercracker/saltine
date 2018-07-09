'use strict';

const { stringify,
        parse }     = JSON,
        Persistence = require('../persistence')

class MemoryPersistence extends Persistence {
  /**
   * Persistence middleware that stores data in memory.
   * Is intended for testing purposes only.
   */
  constructor(){
    super();
    this.database = {};
  }
  async restore(userId){
    return this.database[userId];
  }
  async persist(userId, data){
    this.database[userId] = data;
    return;
  }
}

module.exports = MemoryPersistence;

