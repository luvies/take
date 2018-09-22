import 'mocha';

describe('Loader', function() {
  describe('#fromDir', function() {
    it('should find a standard extension-less Takefile and return an instance');

    it('should find a Takefile with the .js extension and return an instance');

    it('should throw if it cannot find a Takefile');
  });

  describe('#fromFile', function() {
    it('should return an instance if the file exists');

    it('should throw if the file does not exist');
  });

  describe('#loadConfig', function() {
    it('should load a standard JavaScript Takefile');

    it('should let error bubble');
  });
});
