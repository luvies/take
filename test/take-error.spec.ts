import { expect } from 'chai';
import 'mocha';
import { Environment } from '../src/lib/environment';
import { DefaultOptions } from '../src/lib/options';
import { TakeError } from '../src/lib/take-error';

describe('TakeError', function(this) {
  describe('#isTakeError', function(this) {
    it('should correctly identify an instance as one of TakeError', function(this) {
      const err = new TakeError(new Environment(DefaultOptions()));
      expect(TakeError.isTakeError(err)).to.be.true;
    })

    it('should correctly identify an Error instance as not one of TakeError', function(this) {
      const err = new Error();
      expect(TakeError.isTakeError(err)).to.be.false;
    })

    it('should correctly identify non-error variables as not TakeError', function(this) {
      expect(TakeError.isTakeError(undefined)).to.be.false;
      expect(TakeError.isTakeError('test string')).to.be.false;
      expect(TakeError.isTakeError(10)).to.be.false;
      expect(TakeError.isTakeError({ test: 'property' })).to.be.false;
      expect(TakeError.isTakeError([1, 2, 3])).to.be.false;
    })
  });

  describe('#name', function(this) {
    it('should equal the class name', function(this) {
      const err = new TakeError(new Environment(DefaultOptions()));
      expect(err.name).to.equal(TakeError.name);
    });
  });
});
