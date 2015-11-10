import h from './spec_helper';
import Sender from '../src/sender';
import fsAsync from 'file-async';
import BB from 'bluebird';

describe('Sender:', function() {

  it("should Sender exists", function() {
    var sender = new Sender();
    h.expect(sender).to.not.be.undefined;
  });

  it("should parse an error", function() {
    var sender = new Sender();
    var err = new Error('My Exception');

    return sender._prepare(err, {extra: 'EXTRA VALUES'})
      .then(function(result) {
        h.expect(result.body.trace.frames).to.not.be.undefined;
        h.expect(result.body.trace.exception).to.not.be.undefined;
      });
  });

  it("should send error", function() {
    var sender = new Sender();
    var error_to_send = new Error('My Exception');

    var fakeRequestLib = function(options, callback) {
      return callback(null,
                      // response
                      {statusCode: 200},
                      // body (string)
                      '{"result": "OK"}');
    };

    var opts = {
      err: error_to_send,
      extra_values: {
        extra1: 'EXTRA VALUE 1',
        extra2: 'EXTRA VALUE 2'
      },
      url: 'SOME_URL',
    };

    return sender.send(opts, fakeRequestLib)
      .then(function(result) {
        h.expect(result).to.eql('{"result": "OK"}');
      });
  });

  it("should error when sending error and get 404", function() {
    var sender = new Sender({}, { level: 'critical' });
    var error_to_send = new Error('My Exception');

    var fakeRequestLib = function(options, callback) {
      return callback(null,
                      // response
                      {statusCode: 404},
                      // body (string)
                      { message: 'Not found', code: 404 });
    };

    var opts = {
      err: error_to_send,
      extra_values: {
        extra1: 'EXTRA VALUE 1',
        extra2: 'EXTRA VALUE 2'
      },
      url: 'SOME_URL',
    };

    return sender.send(opts, fakeRequestLib)
      .then(function() {
        throw new Error('SHOULD GET AN ERROR');
      })
      .catch(function(error_result) {
        h.expect(error_result.message).to.eql('[404] Not found');
        h.expect(error_result.response).to.eql({ message: 'Not found', code: 404 });
        h.expect(error_result.requestOptions.method).to.eql('post');
        h.expect(error_result.payload.environment).to.eql('development');
        h.expect(error_result.payload.extra1).to.eql('EXTRA VALUE 1');
      });
  });

  it("should error when sending error and get error", function() {
    var sender = new Sender({}, { level: 'critical' });
    var error_to_send = new Error('My Exception');

    var fakeRequestLib = function(options, callback) {
      return callback(new Error('UNUSUAL ERROR'),
                      // response
                      null,
                      // body (string)
                      null);
    };

    var opts = {
      err: error_to_send,
      extra_values: {
        extra1: 'EXTRA VALUE 1',
        extra2: 'EXTRA VALUE 2'
      },
      url: 'SOME_URL',
    };

    return sender.send(opts, fakeRequestLib)
      .then(function() {
        throw new Error('SHOULD GET AN ERROR');
      })
      .catch(function(error_result) {
        h.expect(error_result.message).to.eql('UNUSUAL ERROR');
      });
  });

  it("should error when send in background", function() {
    var sender = new Sender();

    var json = {
      request_opts: {
        method: 'post',
        url: 'SOME_WRONG_URL',
        headers: { 'User-Agent': 'azk' },
        json: true,
        body: '{}'
      },
      payload: {
        environment: 'development',
        level: 'error',
        language: 'javascript',
        framework: 'node-js',
        platform: 'linux',
        server: { host: 'julio-P67A-UD3-B3', argv: '', pid: 4040 },
        extra1: 'EXTRA VALUE 1',
        extra2: 'EXTRA VALUE 2',
        timestamp: 1446649932,
        uuid: 'e1284c94416748c5b8001c69b7054108',
        body: { trace: {} }
      }
    };

    var LOG_ERROR_PATH = '/tmp/bug-report-sender.log';

    return fsAsync.exists(LOG_ERROR_PATH)
      .then((exists) => {
        if (exists) {
          return fsAsync.remove(LOG_ERROR_PATH);
        }
      })
      .then(() => {
        return sender._sendInBackground(json);
      })
      .then((result) => {
        h.expect(result).to.eql(0);
      })
      .then(() => {
        return BB.delay(1000);
      })
      .then(() => {
        return fsAsync.readFile(LOG_ERROR_PATH, 'utf-8');
      })
      .then((content) => {
        h.expect(content).to.contain('Invalid URI');
      });
  });

  // ---------------

  describe('real tests:', function() {

    it("should send real data", function() {
      //    $ ENTRYPOINT=http://api.io/report/uruwhswaB0z3NMBnIxlPV8xXcy+98FBV gulp
      var entrypoint = process.env.ENTRYPOINT;
      if (!entrypoint) {
        console.log('> To run this test need TOKEN env. \n> ex: $ ENTRYPOINT=http://api.io/report/uruwhswaB0z3NMBnIxlPV8xXcy+98FBV gulp test');
        return;
      }

      this.timeout(20000);
      var sender = new Sender();

      var json = {
        request_opts: {
          method: 'post',
          url: entrypoint,
          headers: {
            'content-type': 'application/json',
            'user-agent'  : 'bug-report-sender',
            "origin"      : "bug-report-sender",
            "accept"      : "*/*",
            "connection"  : "keep-alive",
          },
          // jscs:disable maximumLineLength
          // jscs:disable requireSpaceAfterBinaryOperators
          json: {"report":{"environment":"development","level":"error","language":"javascript","framework":"node-js","platform":"linux","server":{"host":"gmmaster-air.local","argv":["/Users/gmmaster/Works/azuki/azk/lib/nvm/v0.10.36/bin/node","/Users/gmmaster/Works/azuki/azk/bin/azk.js","start","-vvvv"],"pid":97583,"os":"OS X","proc_arch":"x64","total_memory":4096,"cpu_info":"Intel(R) Core(TM) i7-2677M CPU @ 1.80GHz","cpu_count":4},"meta":{"agent_session_id":"agent_session_id:c5b8e7a4","command_id":"command_id:efc30fe5","user_id":"tracker_user_id:gullitmiranda","azk_version":"0.16.0"},"timestamp":1446752090,"uuid":"c6ac4e814a104b11aad392737940f048","body":{"trace":{"exception":{"class":"Error","message":"Run system `azkdemo` return: (1), for command: /bin/bash -c exit 1:\n .azkdemo [log] >  \n\nLook for azk start troubleshooting documentation for more info at: http://bit.ly/azk_start_troubleshooting\n"},"frames":[{"method":"process._tickCallback","filename":"node.js","lineno":442,"colno":13},{"method":"Async.drainQueues","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/async.js","lineno":15,"colno":14,"code":"        self._drainQueues();","context":{"pre":["    this._trampolineEnabled = true;","    var self = this;","    this.drainQueues = function () {"],"post":["    };","    this._schedule =","        schedule.isStatic ? schedule(this.drainQueues) : schedule;"]}},{"method":"Async._drainQueues","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/async.js","lineno":187,"colno":10,"code":"    this._drainQueue(this._normalQueue);","context":{"pre":["};","","Async.prototype._drainQueues = function () {"],"post":["    this._reset();","    this._drainQueue(this._lateQueue);","};"]}},{"method":"Async._drainQueue","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/async.js","lineno":177,"colno":16,"code":"            fn._settlePromises();","context":{"pre":["    while (queue.length() > 0) {","        var fn = queue.shift();","        if (typeof fn !== \"function\") {"],"post":["            continue;","        }","        var receiver = queue.shift();"]}},{"method":"Promise._settlePromises","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/promise.js","lineno":646,"colno":14,"code":"        this._settlePromiseAt(i);","context":{"pre":["    this._unsetSettlePromisesQueued();","    var len = this._length();","    for (var i = 0; i < len; i++) {"],"post":["    }","};",""]}},{"method":"Promise._settlePromiseAt","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/promise.js","lineno":530,"colno":18,"code":"            this._settlePromiseFromHandler(handler, receiver, value, promise);","context":{"pre":["        if (!isPromise) {","            handler.call(receiver, value, promise);","        } else {"],"post":["        }","    } else if (receiver instanceof PromiseArray) {","        if (!receiver._isResolved()) {"]}},{"method":"Promise._settlePromiseFromHandler","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/promise.js","lineno":454,"colno":31,"code":"        x = tryCatch(handler).call(receiver, value);","context":{"pre":["    if (receiver === APPLY && !this._isRejected()) {","        x = tryCatch(handler).apply(this._boundTo, value);","    } else {"],"post":["    }","    promise._popContext();",""]}},{"method":"tryCatcher","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/util.js","lineno":24,"colno":31,"code":"        return tryCatchTarget.apply(this, arguments);","context":{"pre":["var tryCatchTarget;","function tryCatcher() {","    try {"],"post":["    } catch (e) {","        errorObj.e = e;","        return errorObj;"]}},{"method":"raise","filename":"/azk:0.16.0/src/system/run.js","lineno":356,"colno":17},{"method":"new SystemRunError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":115,"colno":28},{"method":"SystemRunError.SystemError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":100,"colno":25},{"method":"SystemRunError.AzkError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":27,"colno":29},{"method":"Error","filename":"<anonymous>","lineno":null,"colno":null}]}}}},
          // jscs:enable maximumLineLength
          // jscs:enable requireSpaceAfterBinaryOperators
        },
        payload: {
          environment: 'development',
          level: 'error',
          language: 'javascript',
          framework: 'node-js',
          platform: 'linux',
          server: { host: 'julio-P67A-UD3-B3', argv: '', pid: 4040 },
          extra1: 'EXTRA VALUE 1',
          extra2: 'EXTRA VALUE 2',
          timestamp: 1446649932,
          uuid: 'e1284c94416748c5b8001c69b7054108',
          body: ''
        }
      };

      return sender._send(json)
        .then((result) => {
          h.expect(result).has.property('status', 'ok');
        });
    });

    it("should send error to real entrypoint", function() {
      var sender = new Sender();
      var error_to_send = new Error('My Exception');

      var entrypoint = process.env.ENTRYPOINT;
      if (!entrypoint) {
        console.log('> To run this test need TOKEN env. \nex: $ ENTRYPOINT=http://api.io/report/uruwhswaB0z3NMBnIxlPV8xXcy+98FBV gulp test');
        return;
      }

      var opts = {
        err: error_to_send,
        extra_values: {
          extra1: 'EXTRA VALUE 1',
          extra2: 'EXTRA VALUE 2'
        },
        url: entrypoint,
        jsonWrapper    : (payload) => { return { report: payload }; },
      };

      return sender.send(opts)
        .then(function(result) {
          h.expect(result.status).to.eql('ok');
        });
    });

    //FIXME: should create the log file
    it("should success when send in background", function() {
      var sender = new Sender();

      //    $ ENTRYPOINT=http://api.io/report/uruwhswaB0z3NMBnIxlPV8xXcy+98FBV gulp
      var entrypoint = process.env.ENTRYPOINT;
      if (!entrypoint) {
        console.log('> To run this test need TOKEN env. \n> ex: $ ENTRYPOINT=http://api.io/report/uruwhswaB0z3NMBnIxlPV8xXcy+98FBV gulp test');
        return;
      }

      var json = {
        request_opts: {
          method: 'post',
          url: entrypoint,
          headers: {
            'content-type': 'application/json',
            'user-agent'  : 'bug-report-sender',
            "origin"      : "bug-report-sender",
            "accept"      : "*/*",
            "connection"  : "keep-alive",
          },
          // jscs:disable maximumLineLength
          // jscs:disable requireSpaceAfterBinaryOperators
          json: {"report":{"environment":"development","level":"error","language":"javascript","framework":"node-js","platform":"linux","server":{"host":"gmmaster-air.local","argv":["/Users/gmmaster/Works/azuki/azk/lib/nvm/v0.10.36/bin/node","/Users/gmmaster/Works/azuki/azk/bin/azk.js","start","-vvvv"],"pid":97583,"os":"OS X","proc_arch":"x64","total_memory":4096,"cpu_info":"Intel(R) Core(TM) i7-2677M CPU @ 1.80GHz","cpu_count":4},"meta":{"agent_session_id":"agent_session_id:c5b8e7a4","command_id":"command_id:efc30fe5","user_id":"tracker_user_id:gullitmiranda","azk_version":"0.16.0"},"timestamp":1446752090,"uuid":"c6ac4e814a104b11aad392737940f048","body":{"trace":{"exception":{"class":"Error","message":"Run system `azkdemo` return: (1), for command: /bin/bash -c exit 1:\n .azkdemo [log] >  \n\nLook for azk start troubleshooting documentation for more info at: http://bit.ly/azk_start_troubleshooting\n"},"frames":[{"method":"process._tickCallback","filename":"node.js","lineno":442,"colno":13},{"method":"Async.drainQueues","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/async.js","lineno":15,"colno":14,"code":"        self._drainQueues();","context":{"pre":["    this._trampolineEnabled = true;","    var self = this;","    this.drainQueues = function () {"],"post":["    };","    this._schedule =","        schedule.isStatic ? schedule(this.drainQueues) : schedule;"]}},{"method":"Async._drainQueues","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/async.js","lineno":187,"colno":10,"code":"    this._drainQueue(this._normalQueue);","context":{"pre":["};","","Async.prototype._drainQueues = function () {"],"post":["    this._reset();","    this._drainQueue(this._lateQueue);","};"]}},{"method":"Async._drainQueue","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/async.js","lineno":177,"colno":16,"code":"            fn._settlePromises();","context":{"pre":["    while (queue.length() > 0) {","        var fn = queue.shift();","        if (typeof fn !== \"function\") {"],"post":["            continue;","        }","        var receiver = queue.shift();"]}},{"method":"Promise._settlePromises","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/promise.js","lineno":646,"colno":14,"code":"        this._settlePromiseAt(i);","context":{"pre":["    this._unsetSettlePromisesQueued();","    var len = this._length();","    for (var i = 0; i < len; i++) {"],"post":["    }","};",""]}},{"method":"Promise._settlePromiseAt","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/promise.js","lineno":530,"colno":18,"code":"            this._settlePromiseFromHandler(handler, receiver, value, promise);","context":{"pre":["        if (!isPromise) {","            handler.call(receiver, value, promise);","        } else {"],"post":["        }","    } else if (receiver instanceof PromiseArray) {","        if (!receiver._isResolved()) {"]}},{"method":"Promise._settlePromiseFromHandler","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/promise.js","lineno":454,"colno":31,"code":"        x = tryCatch(handler).call(receiver, value);","context":{"pre":["    if (receiver === APPLY && !this._isRejected()) {","        x = tryCatch(handler).apply(this._boundTo, value);","    } else {"],"post":["    }","    promise._popContext();",""]}},{"method":"tryCatcher","filename":"/Users/gmmaster/Works/azuki/azk/node_modules/bluebird/js/main/util.js","lineno":24,"colno":31,"code":"        return tryCatchTarget.apply(this, arguments);","context":{"pre":["var tryCatchTarget;","function tryCatcher() {","    try {"],"post":["    } catch (e) {","        errorObj.e = e;","        return errorObj;"]}},{"method":"raise","filename":"/azk:0.16.0/src/system/run.js","lineno":356,"colno":17},{"method":"new SystemRunError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":115,"colno":28},{"method":"SystemRunError.SystemError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":100,"colno":25},{"method":"SystemRunError.AzkError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":27,"colno":29},{"method":"Error","filename":"<anonymous>","lineno":null,"colno":null}]}}}},
          // jscs:enable maximumLineLength
          // jscs:enable requireSpaceAfterBinaryOperators
        },
        payload: {
          environment: 'development',
          level: 'error',
          language: 'javascript',
          framework: 'node-js',
          platform: 'linux',
          server: { host: 'julio-P67A-UD3-B3', argv: '', pid: 4040 },
          extra1: 'EXTRA VALUE 1',
          extra2: 'EXTRA VALUE 2',
          timestamp: 1446649932,
          uuid: 'e1284c94416748c5b8001c69b7054108',
          body: ''
        }
      };

      var LOG_ERROR_PATH = '/tmp/bug-report-sender.log';

      return fsAsync.exists(LOG_ERROR_PATH)
        .then((exists) => {
          if (exists) {
            return fsAsync.remove(LOG_ERROR_PATH);
          }
        })
        .then(() => {
          return sender._sendInBackground(json);
        })
        .then((result) => {
          h.expect(result).to.eql(0);
        })
        .then(() => {
          return BB.delay(1000);
        })
        .then(() => {
          return fsAsync.exists(LOG_ERROR_PATH);
        })
        .then((exists) => {
          h.expect(exists).to.eql(false);
        });
    });
  });

});
