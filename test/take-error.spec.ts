import { expect } from 'chai';
import 'mocha';
import { DefaultOptions, Environment, TakeError } from '../src/lib';

describe('TakeError', function() {
  describe('#isTakeError', function() {
    it('should correctly identify an instance as one of TakeError', function() {
      const err = new TakeError(new Environment(DefaultOptions()));
      expect(TakeError.isTakeError(err)).to.be.true;
    })

    it('should correctly identify an Error instance as not one of TakeError', function() {
      const err = new Error();
      expect(TakeError.isTakeError(err)).to.be.false;
    })

    it('should correctly identify non-error variables as not TakeError', function() {
      expect(TakeError.isTakeError(undefined)).to.be.false;
      expect(TakeError.isTakeError('test string')).to.be.false;
      expect(TakeError.isTakeError(10)).to.be.false;
      expect(TakeError.isTakeError({ test: 'property' })).to.be.false;
      expect(TakeError.isTakeError([1, 2, 3])).to.be.false;
    })
  });

  describe('#name', function() {
    it('should equal the class name', function() {
      const err = new TakeError(new Environment(DefaultOptions()));
      expect(err.name).to.equal(TakeError.name);
    });
  });
});
