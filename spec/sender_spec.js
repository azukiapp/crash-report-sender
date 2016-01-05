import h from './spec_helper';
import Sender from '../src/sender';
import fsAsync from 'file-async';
import clone from 'lodash.clone';

describe('Sender:', function() {
  var logger, log_file, sender;
  var error_to_send = new Error('My Exception');
  var default_opts  = {
    err: error_to_send,
    extra_values: {
      extra1: 'EXTRA VALUE 1',
      extra2: 'EXTRA VALUE 2'
    },
    url: 'SOME_URL',
  };

  before(() => {
    sender   = new Sender({}, { level: 'debug', console: false });
    logger   = sender.logger;
    log_file = logger.filename;
  });

  beforeEach(() => {
    return fsAsync.exists(log_file).then((exists) => {
      if (exists) {
        return fsAsync.truncate(log_file);
      }
    });
  });

  it("should parse an error", function() {
    return sender._prepare(error_to_send, {extra: 'EXTRA VALUES'})
      .then(function(result) {
        h.expect(result.body.trace.frames).to.not.be.undefined;
        h.expect(result.body.trace.exception).to.not.be.undefined;
      });
  });

  it("should send error", function() {
    var fakeRequestLib = function(options, callback) {
      return callback(null,
                      // response
                      {statusCode: 200},
                      // body (string)
                      {"result": "OK"});
    };

    let result = sender.send(default_opts, fakeRequestLib);
    return h.expect(result).to.eventually.deep.has.property('result', "OK");
  });

  it("should error when sending error and get 404", function() {
    var sender = new Sender({}, { level: 'critical' });
    var fakeRequestLib = function(options, callback) {
      return callback(null,
                      // response
                      {statusCode: 404},
                      // body (string)
                      { message: 'Not found', code: 404 });
    };

    return sender.send(default_opts, fakeRequestLib)
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
    var fakeRequestLib = function(options, callback) {
      return callback(new Error('UNUSUAL ERROR'),
                      // response
                      null,
                      // body (string)
                      null);
    };

    let result = sender.send(default_opts, fakeRequestLib);
    return h.expect(result).to.rejectedWith(/UNUSUAL ERROR/);
  });

  it("should error when send in background", function() {
    var opts   = clone(default_opts);
    opts.background_send = true;

    return sender.send(opts)
      .then((result) => {
        h.expect(result).to.eql(0);
      })
      .then(() => {
        return fsAsync.watch(log_file, { persistent: false }).catch(() => {});
      })
      .then(() => {
        return fsAsync.readFile(log_file, 'utf-8');
      })
      .then((content) => {
        h.expect(content).to.contain('Invalid URI');
      });
  });

  // ---------------

  describe('real integration tests:', function() {
    // Slow tests
    this.timeout(20000);

    let real_data = {
      err: error_to_send,
      extra_values: {
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
      },
      jsonWrapper: (payload) => { return { report: payload }; }
    };

    before(() => {
      real_data.url = process.env.CRASH_REPORT_ENTRYPOINT;
      if (!real_data.url) {
        throw new Error([
          '> To run this test need TOKEN env. \n',
          '> ex: $ CRASH_REPORT_ENTRYPOINT=http://api.io/report/uruwhswaB0z3NMBnIxlPV8xXcy+98FBV gulp test'
        ].join(''));
      }
    });

    it("should send real data to real entrypoint", function() {
      return h.expect(sender.send(real_data)).to.eventually.deep.has.property('status', 'ok');
    });

    //FIXME: should create the log file
    it("should success when send in background", function() {
      var data =  clone(real_data);
      data.background_send = true;

      return sender.send(data)
        .then((result) => {
          h.expect(result).to.eql(0);
        })
        .then(() => {
          return fsAsync.watch(log_file, { persistent: false }).catch(() => {});
        })
        .then(() => {
          return fsAsync.readFile(log_file, 'utf-8');
        })
        .then((content) => {
          h.expect(content).to.contain('report sendend, response');
        });
    });
  });
});
