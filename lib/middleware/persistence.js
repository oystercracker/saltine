'use strict';

/**
 * This middleware, when extended, persists the last request(i.e. session data) and the storage
 * object from the context.
 * 
 * The before() and after() functions should probably be left alone, and instead the persist()
 * and restore() functions should be overridden.
 */

class Persistence {
  /**
   * Attempts to retrieve persisted user data and add it to the context.
   * It will retrieve the storage object, and it will retrieve the previous
   * session(if available) and the long-term storage object.
   */
  async before(context){
    if(!context.get('request.isNew')) return;
    const userId = context.get('request.userId');
    if(!userId) throw new Error('User ID not found in request when restoring session.');
    const json   = await this.restore(userId);
    if(!json) return;
    context.set('savedSessionData', json.SESSION);
    context.set('storage',          json.STORAGE);
  }
  /**
   * Saves the last request object for the session and the long-term storage object.
   */
  async after(context){
    const userId = context.get('request.userId');
    if(!userId) throw new Error('User ID not found in request when performing session persistence.');
    const data = {
      STORAGE: context.get('storage')
    };
    if(context.get('error') || !context.get('response.shouldEndSession')) {
      data['SESSION'] = context.get('request.originalRequest');
    }
    return await this.persist(userId, data);
  }
  /**
   * Given a user ID and a data object, store the data for later use.
   * Subclasses should implement storage functionality.
   * @param {string} userId - A string unique to the user.
   * @param {object} data   - The data object to be persisted.
   */
  async persist(userId, data){ // eslint-disable-line no-unused-vars
    // IMPLEMENT ME
  }
  /**
   * Given a user ID, retreive previously saved data.
   * @param {string} userId - A string unique to the user.
   */
  async restore(userId){ // eslint-disable-line no-unused-vars
    // IMPLEMENT ME
  }

}

module.exports = Persistence;

