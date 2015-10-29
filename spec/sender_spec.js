import h from './spec_helper';
import Sender from '../src/sender';

describe('Sender:', function() {

  it("should Sender exists", function() {
    var sender = new Sender();
    h.expect(sender).to.not.be.undefined;
  });

  it("should parse an error", function() {
    var sender = new Sender();
    var err = new Error('my Exception');

    return sender.prepare(err, {extra: 'EXTRA VALUE'})
    .then(function(result) {
      h.expect(result.body.trace.frames).to.not.be.undefined;
      h.expect(result.body.trace.exception).to.not.be.undefined;
    });
  });

});
