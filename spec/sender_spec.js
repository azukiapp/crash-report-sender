import h from './spec_helper';
import Sender from '../src/sender';
// import fs from 'fs';

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
    var sender = new Sender();
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
    var sender = new Sender();
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
      h.expect(error_result.body).to.be.null;
      h.expect(error_result.requestOptions.method).to.eql('post');
      h.expect(error_result.payload.environment).to.eql('development');
      h.expect(error_result.payload.extra1).to.eql('EXTRA VALUE 1');
    });
  });

  it("should send in background", function() {
    var sender = new Sender();
    var error_to_send = new Error('My Exception');

    var opts = {
      err: error_to_send,
      extra_values: {
        extra1: 'EXTRA VALUE 1',
        extra2: 'EXTRA VALUE 2'
      },
      url: 'SOME_URL',
      background_send: true,
      enable_tmp_file_debug: true
    };

    return sender.send(opts)
    .then(function(result) {
      h.expect(result).to.eql(0);

      // TODO: need to check several times waiting to be created
      // var content = fs.readFileSync('/tmp/bug-report-sender.log', 'utf8');
      // var content_json = JSON.parse(content);
      // h.expect(content_json.requestOptions).to.not.undefined;
      // h.expect(content_json.payload).to.not.undefined;
    });
  });

});
