import { parseException } from './stack-trace-parser';
import Logger from './logger';
import uuid from 'node-uuid';
import merge from 'lodash.merge';
import os from 'os';
import BB from 'bluebird';
import { spawn } from 'child_process';
import path from 'path';

module.exports = class Sender {
  constructor(opt, logger_opts) {
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
    this.logger = new Logger(logger_opts);
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
          this.logger.error(['_prepare', 'parseException()'], err);
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

  _getRequestOptions(postUri) {
    var request_opts = {
      method: 'post',
      url: postUri,
      headers: {
        'User-Agent': 'azk'
      },
      json: true,
      body: JSON.stringify({ report: this.payload })
    };

    return {
      request_opts: request_opts,
      payload: this.payload,
    };
  }

  _send(opts, requestFunction) {
    var request = requestFunction || require('request');
    return new BB.Promise((resolve, reject) => {
      request(opts.request_opts, (error, response, body) => {
        var is_valid = response && (response.statusCode === 200 || response.statusCode === 201);
        if (error || !is_valid) {
          // there is no error, lets create one
          if (!error && body && body.code && body.message) {
            let error_message = `[${body.code}] ${body.message}`;

            error = new Error(error_message);
            error.body = body;
            error.requestOptions = opts.request_opts;
            error.payload = opts.payload;
          }

          // include some useful stuf on error
          this.logger.error(['_send', 'request'], 'status code: ' + response.statusCode, error);
          this.logger.error(['_send', 'request'], error);

          return reject(error);
        } else {
          var result = {
            body: body,
            payload: opts.payload
          };
          this.logger.log(['_send', 'request'], result);
          return resolve(result);
        }
      });
    });
  }

  _sendInBackground(request_options) {
    return new BB.Promise((resolve) => {

      var child = spawn('node', [path.join(__dirname, 'background-push.js')], {
        detached: true,
        stdio   : [null, null, null, 'pipe'],
      });

      // Send configs to child
      var pipe = child.stdio[3];
      var buff = Buffer(JSON.stringify(request_options));
      pipe.write(buff);
      child.unref();

      resolve(0);
    });
  }

  send(opts, requestFunction = null) {
    // parse error
    return this._prepare(opts.err, opts.extra_values)
    .then(() => {
      // get request options
      var request_options = this._getRequestOptions(opts.url);
      if (opts.background_send) {
        // send in background
        return this._sendInBackground(request_options);
      } else {
        // send and wait
        return this._send(request_options, requestFunction);
      }

    });
  }

};
