'use strict';

const { stringify,
        parse }     = JSON,
        Persistence = require('../persistence');

class PouchDBPersistence extends Persistence {
  /**
   * Persistence middleware that uses PouchDB.  
   * @param {PouchDB} db - A PouchDB database connection object.
   */
  constructor(db, options={}){
    super();
    this.options = options;
    this.db      = db;
  }
  async restore(_id){
    return this.db.get(_id)
                  .then(doc => doc.data)
                  .catch(err => {
                    if(err && err.status === 404) return;
                    return Promise.reject(err);
                  });
  }
  async persist(_id, data){
    return this.db.get(_id)
                  .catch(err => {
                    if(err && err.status === 404) return;
                    return Promise.reject(err);
                  })
                  .then(resp => {
                    const doc = { _id, data };
                    if(resp && resp._rev) doc._rev = resp._rev;
                    return this.db.put(doc);
                  });
  }
}

module.exports = PouchDBPersistence;

