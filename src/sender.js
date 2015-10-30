import { parseException } from './stack-trace-parser';
import uuid from 'node-uuid';
import merge from 'lodash.merge';
import os from 'os';
import BB from 'bluebird';

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

  _prepare(err, extra_values) {
    return new BB.Promise((resolve, reject) => {
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

  _send(requestFunction, postUri) {
    var payload = this.payload;

    var options = {
      method: 'post',
      url: postUri,
      headers: {
        'User-Agent': 'azk'
      },
      json: true,
      body: JSON.stringify(payload)
    };

    return new BB.Promise((resolve, reject) => {
      requestFunction(options, (error, response, body) => {
        var is_valid = response && (response.statusCode === 200 || response.statusCode === 201);
        if (error || !is_valid) {

          // there is no error, lets create one
          if (!error) {
            var error_message = '_send error';
            if (body && body.code && body.message) {
              error_message = `[${body.code}] ${body.message}`;
            }
            error = new Error(error_message);
          }

          // include some useful stuf on error
          error.body = body;
          error.requestOptions = options;
          error.payload = payload;

          return reject(error);
        } else {
          return resolve({
            body: body,
            payload: payload
          });
        }
      });
    });
  }

  send(opts) {
    var requestFunction = opts.libs.requestFunction || require('request');
    return this._prepare(opts.err, opts.extra_values)
    .then(() => { return this._send(requestFunction, opts.url); });
  }

};
