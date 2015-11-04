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

    return fsAsync.stat(LOG_ERROR_PATH)
    .then((file_stat) => {
      if (file_stat.isFile()) {
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

});
