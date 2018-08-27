import { expect } from 'chai';
import 'mocha';
import { UserError } from '../src/errors/user-error';

describe('UserError', function(this) {
  describe('#isUserError', function(this) {
    it('should correctly identify an instance as one of UserError', function(this) {
      const err = new UserError();
      expect(UserError.isUserError(err)).to.be.true;
    })

    it('should correctly identify an Error instance as not one of UserError', function(this) {
      const err = new Error();
      expect(UserError.isUserError(err)).to.be.false;
    })

    it('should correctly identify non-error variables as not UserError', function(this) {
      expect(UserError.isUserError(undefined)).to.be.false;
      expect(UserError.isUserError('test string')).to.be.false;
      expect(UserError.isUserError(10)).to.be.false;
      expect(UserError.isUserError({ test: 'property' })).to.be.false;
      expect(UserError.isUserError([1, 2, 3])).to.be.false;
    })
  });

  describe('#name', function(this) {
    it('should equal the class name', function(this) {
      const err = new UserError();
      expect(err.name).to.equal(UserError.name);
    });
  });
});
