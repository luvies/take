import 'mocha';

describe('directoryExistsStats', function() {
  it('should return the correct results if a directory is found');

  it('should return the correct results if no directory is found');

  it('should return the correct results if only a file is found');
});

describe('directoryExists', function() {
  it('should return true if a directory is found');

  it('should return false if no directory is found');

  it('should return false if only a file is found');
});

describe('fileExistsStats', function() {
  it('should return the correct results if a file is found');

  it('should return the correct results if no file is found');

  it('should return the correct results if only a directory is found');
});

describe('fileExists', function() {
  it('should return true if a file is found');

  it('should return false if no file is found');

  it('should return false if only a directory is found');
});
