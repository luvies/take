import 'mocha';

describe('Take', function() {
  describe('#newInstance', function() {
    it('should return a valid instance when searching a directory');

    it('should return a valid instance when given an exact path');

    it('should apply the envSetup function to the Environment object');
  });

  describe('#createTakefileEnv', function() {
    it('should create a copy of Utils while adding properties to it');
  });

  describe('#run', function() {
    it('should run a list of targets synchronously');

    it('should throw if a given name doesn\'t exist');
  });

  describe('#getTargetListString', function() {
    it('should return a list of lines proportional to the number of targets');
  });

  describe('#getTargetDepTreeString', function() {
    it('should return a list of lines propertional to the given target\'s depenceny tree');
  });
});
