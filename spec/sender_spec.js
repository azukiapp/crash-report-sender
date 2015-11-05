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
      h.expect(result.body).to.eql('{"result": "OK"}');
      h.expect(result.payload.environment).to.eql('development');
      h.expect(result.payload.extra1).to.eql('EXTRA VALUE 1');
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
      h.expect(error_result.body).to.eql({ message: 'Not found', code: 404 });
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

  it("should send in background", function() {
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

  it("should send real data", function() {
    var sender = new Sender();

    var json = {
      request_opts: {
        method: 'post',
        url: 'http://force-stage.azk.io/report/A2ObXDzlG6fOJC803qBzDjde2YxygZY4',
        headers: { 'User-Agent': 'azk' },
        json: true,
        body: '{"report":{"environment":"development","level":"error","language":"javascript","framework":"node-js","platform":"linux","server":{"host":"julio-P67A-UD3-B3","argv":["/home/julio/_git/azk/lib/nvm/v0.10.36/bin/node","/home/julio/_git/azk/bin/azk.js","start","-l","debug"],"pid":13941,"os":"Linux 3.16","proc_arch":"x64","total_memory":7968,"cpu_info":"Intel(R) Core(TM) i5-2400 CPU @ 3.10GHz","cpu_count":4},"meta":{"agent_session_id":"agent_session_id:c6e6279d","command_id":"command_id:56be2c67","user_id":"tracker_user_id:saitodisse","azk_version":"0.16.0"},"timestamp":1446746806,"uuid":"6da10f4aa7224163a9e57c74dd959d62","body":{"trace":{"exception":{"class":"Error","message":"Run system `shout` return: (0), for command: /bin/bash -c sleep 2 && node index.js:\\n[timeout] `azk` has timed out on `shout` system.\\n[timeout] Failure to reach port `32772` from `\\u001b[4mhttp://shout.dev.azk.io\\u001b[24m` after 1000 milliseconds.\\n[timeout] Make sure the start command binds `port` to the `0.0.0.0` interface, not only to the `localhost` interface.\\n[timeout] You might want to edit your `Azkfile.js` in order to increase the maximum timeout.\\n\\nLook for azk start troubleshooting documentation for more info at: http://bit.ly/azk_start_troubleshooting\\n"},"frames":[{"method":"process._tickCallback","filename":"node.js","lineno":442,"colno":13},{"method":"Async.drainQueues","filename":"/home/julio/_git/azk/node_modules/bluebird/js/main/async.js","lineno":15,"colno":14,"code":"        self._drainQueues();","context":{"pre":["    this._trampolineEnabled = true;","    var self = this;","    this.drainQueues = function () {"],"post":["    };","    this._schedule =","        schedule.isStatic ? schedule(this.drainQueues) : schedule;"]}},{"method":"Async._drainQueues","filename":"/home/julio/_git/azk/node_modules/bluebird/js/main/async.js","lineno":187,"colno":10,"code":"    this._drainQueue(this._normalQueue);","context":{"pre":["};","","Async.prototype._drainQueues = function () {"],"post":["    this._reset();","    this._drainQueue(this._lateQueue);","};"]}},{"method":"Async._drainQueue","filename":"/home/julio/_git/azk/node_modules/bluebird/js/main/async.js","lineno":177,"colno":16,"code":"            fn._settlePromises();","context":{"pre":["    while (queue.length() > 0) {","        var fn = queue.shift();","        if (typeof fn !== \\"function\\") {"],"post":["            continue;","        }","        var receiver = queue.shift();"]}},{"method":"Promise._settlePromises","filename":"/home/julio/_git/azk/node_modules/bluebird/js/main/promise.js","lineno":646,"colno":14,"code":"        this._settlePromiseAt(i);","context":{"pre":["    this._unsetSettlePromisesQueued();","    var len = this._length();","    for (var i = 0; i < len; i++) {"],"post":["    }","};",""]}},{"method":"Promise._settlePromiseAt","filename":"/home/julio/_git/azk/node_modules/bluebird/js/main/promise.js","lineno":528,"colno":21,"code":"            handler.call(receiver, value, promise);","context":{"pre":["","    if (typeof handler === \\"function\\") {","        if (!isPromise) {"],"post":["        } else {","            this._settlePromiseFromHandler(handler, receiver, value, promise);","        }"]}},{"method":"PromiseSpawn._next","filename":"/home/julio/_git/azk/node_modules/bluebird/js/main/generators.js","lineno":100,"colno":49,"code":"    var result = tryCatch(this._generator.next).call(this._generator, value);","context":{"pre":["","PromiseSpawn.prototype._next = function (value) {","    this._promise._pushContext();"],"post":["    this._promise._popContext();","    this._continue(result);","};"]}},{"method":"GeneratorFunctionPrototype.tryCatcher","filename":"/home/julio/_git/azk/node_modules/bluebird/js/main/util.js","lineno":24,"colno":31,"code":"        return tryCatchTarget.apply(this, arguments);","context":{"pre":["var tryCatchTarget;","function tryCatcher() {","    try {"],"post":["    } catch (e) {","        errorObj.e = e;","        return errorObj;"]}},{"method":"<unknown>","filename":"GeneratorFunctionPrototype.Gp.(anonymous function) [as next] (/home/julio/_git/azk/node_modules/babel-runtime/regenerator/runtime.js","lineno":262,"colno":19},{"method":"GeneratorFunctionPrototype.invoke [as _invoke]","filename":"/home/julio/_git/azk/node_modules/babel-runtime/regenerator/runtime.js","lineno":229,"colno":22,"code":"        var record = tryCatch(innerFn, self, context);","context":{"pre":["","        state = GenStateExecuting;",""],"post":["        if (record.type === \\"normal\\") {","          // If an exception is thrown from innerFn, we leave state ===","          // GenStateExecuting and loop back for another invocation."]}},{"method":"tryCatch","filename":"/home/julio/_git/azk/node_modules/babel-runtime/regenerator/runtime.js","lineno":65,"colno":40,"code":"      return { type: \\"normal\\", arg: fn.call(obj, arg) };","context":{"pre":["  // has a stable shape and so hopefully should be cheap to allocate.","  function tryCatch(fn, obj, arg) {","    try {"],"post":["    } catch (err) {","      return { type: \\"throw\\", arg: err };","    }"]}},{"method":"Object.callee$1$0$","filename":"/azk:0.16.0/src/system/run.js","lineno":320,"colno":17},{"method":"new SystemRunError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":115,"colno":28},{"method":"SystemRunError.SystemError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":100,"colno":25},{"method":"SystemRunError.AzkError","filename":"/azk:0.16.0/src/utils/errors.js","lineno":27,"colno":29},{"method":"Error","filename":"<anonymous>","lineno":null,"colno":null}]}}}}'
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
        // jscs:disable maximumLineLength
        body: ''
        // jscs:enable maximumLineLength
      }
    };

    return sender._send(json)
    .then((result) => {
      /**/console.log('\n>>---------\n result:\n', result, '\n>>---------\n');/*-debug-*/
    })
    .catch((err) => {
      /**/console.log('\n>>---------\n err:\n', err, '\n>>---------\n');/*-debug-*/
    });

  });

});
