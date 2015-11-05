import h from './spec_helper';
import { parseException, parseStack} from '../src/stack-trace-parser';

describe('parseException:', function() {

  it("should parseException exists", function() {
    h.expect(parseException).to.not.be.undefined;
  });

  it("should parseException work", function() {
    var exc = new Error('my Exception');
    parseException(exc, function(err, result) {
      h.expect(result).to.not.be.undefined;
    });
  });

  it("should parseStack exists", function() {
    h.expect(parseStack).to.not.be.undefined;
  });

  it("should parseStack work", function() {
    var exc = new Error('my Exception');
    parseStack(exc.stack, function(err, result) {
      h.expect(result).to.not.be.undefined;
    });
  });

});
