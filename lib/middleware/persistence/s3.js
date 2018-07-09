'use strict';

const { stringify,
        parse }     = JSON,
        Persistence = require('../persistence');

class S3Persistence extends Persistence {
  /**
   * Persistence middleware that uses Amazon S3.
   * @param {AWS.S3}    s3             - An instance of AWS.S3 with the credentials set. 
   * @param {object={}} options
   * @param {string}    options.bucket - The bucket name.
   */
  constructor(s3, options={}){
    super();
    this.options = options;
    this.s3      = s3;
  }
  async restore(userId){
    const params = {
            Key:    `${userId}.json`
          };
    if(this.options.hasOwnProperty('bucket')) params.Bucket = this.options.bucket;
    return new Promise((resolve, reject) => {
      this.s3.getObject(params, (err, data) => {
        if(err && err.code === 'NoSuchKey') return resolve();
        if(err)        return reject(err);
        if(!data.Body) return resolve();
        const json = parse(data.Body.toString('utf-8'));
        resolve(json);
      });
    });
  }
  async persist(userId, data){
    const params = {
            Key:    `${userId}.json`,
            Body:   new Buffer(stringify(data), 'utf8')
          };
    if(this.options.hasOwnProperty('bucket')) params.Bucket = this.options.bucket;
    return new Promise((resolve, reject) => {
      this.s3.putObject(params, (err) => {
        if(err) return reject(err);
        resolve();
      });
    });
  }
}

module.exports = S3Persistence;

