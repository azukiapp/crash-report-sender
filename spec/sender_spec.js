import h from './spec_helper';
import Sender from '../src/sender';

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
      libs: {requestFunction: fakeRequestLib},
      url: 'SOME_URL',
    };

    return sender.send(opts)
    .then(function(result) {
      h.expect(result).to.eql('{"result": "OK"}');
    });
  });

});
