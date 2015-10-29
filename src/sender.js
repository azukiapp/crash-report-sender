import { parseException } from './stack-trace-parser';
import uuid from 'node-uuid';
import merge from 'lodash.merge';
import os from 'os';

module.exports = class Sender {
  constructor(opt) {
    this.payload = merge({}, {
      environment: 'development',
      level: 'error',
      language: 'javascript',
      framework: 'node-js',
      platform: 'linux',
      server: {
        host: os.hostname(),
        argv: process.argv.concat(),
        pid: process.pid
      }
    },
    opt);
  }

  _genUuid() {
    var buf = new Buffer(16);
    uuid.v4(null, buf);
    return buf.toString('hex');
  }

  prepare(err, extra_values) {
    return new Promise((resolve, reject) => {
      parseException(err, (err, parse_result) => {

        if (err) {
          return reject(err);
        }

        // merge extra_values
        this.payload = merge({}, this.payload, extra_values);

        // get error details
        var error_class = parse_result.class;
        var error_message = parse_result.message;
        var error_frames = parse_result.frames;

        // prepare final payload object
        this.payload.timestamp = Math.floor((new Date().getTime()) / 1000);
        this.payload.uuid = this._genUuid();
        this.payload.body = {
          trace: {
            exception: {
              class: error_class,
              message: error_message
            },
            frames: error_frames
          }
        };

        resolve(this.payload);
      });
    });
  }
};
