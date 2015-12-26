import h from './spec_helper';
import Index from '../../index';

describe('Index:', function() {
  it("should Index exists", function() {
    h.expect(Index).to.not.be.undefined;
  });

  it("should send() exists", function() {
    var index = new Index();
    h.expect(index.send).to.not.be.undefined;
  });
});
