'use strict';

const { stringify,
        parse }     = JSON,
        Persistence = require('../persistence');

        
class DynamoDBPersistence extends Persistence {
  /**
   * Persistence middleware that uses Amazon DynamoDB.
   * @param {AWS.DynamoDB.DocumentClient} dynamoDB - An instance of AWS.DynamoDB.DocumentClient with the credentials set. 
   * @param {object={}}    options
   * @param {string}       options.tableName       - The DynamoDB table name.
   */
  constructor(dynamoDB, options={}){
    super();
    this.options  = options;
    this.dynamoDB = dynamoDB;
  }
  async restore(userId){
    const params = {
            Key: {
              userId
            }
          };
    if(this.options.hasOwnProperty('tableName')) params.TableName = this.options.tableName;
    return new Promise((resolve, reject) => {
      this.dynamoDB.get(params, function(err, data) {
        if(err && err.code === 'ResourceNotFoundException') return resolve();
        if(err) return reject(err);
        if(!data) return reject(new Error('Data object expected but none present.'));
        resolve(data.Attributes);
      });
    });
  }
  async persist(userId, data){
    const params = {
            userId,
            data
          };
    if(this.options.hasOwnProperty('tableName')) params.TableName = this.options.tableName;
    return new Promise((resolve, reject) => {
      this.dynamoDB.put(params, (err) => {
        if(err) return reject(err);
        resolve();
      });
    });
  }
}

module.exports = DynamoDBPersistence;

