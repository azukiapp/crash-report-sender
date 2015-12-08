import h from './spec_helper';
import { parser } from 'rollbar';

describe('parseException:', function() {

  it("should parseException exists", function() {
    h.expect(parser.parseException).to.not.be.undefined;
  });

  it("should parseException work", function() {
    var exc = new Error('my Exception');
    parser.parseException(exc, function(err, result) {
      h.expect(result).to.not.be.undefined;
    });
  });

  it("should parseStack exists", function() {
    h.expect(parser.parseStack).to.not.be.undefined;
  });

  it("should parseStack work", function() {
    var exc = new Error('my Exception');
    parser.parseStack(exc.stack, function(err, result) {
      h.expect(result).to.not.be.undefined;
    });
  });

});
