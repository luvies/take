import 'mocha';

describe('Utils', function() {
  describe('#copy', function() {
    it('should return a completely separate instace with the exact same config');
  });

  describe('#constructor', function() {
    it('should construct');
  });

  describe('#log', function() {
    it('should log to stdout');

    it('should not log if take stdout suppression is on');
  });

  describe('#logError', function() {
    it('should log to stderr');

    it('should not log if take stderr suppression is on');
  });

  describe('#error', function() {
    it('should throw a TakeError');
  });

  describe('#useEmoji', function() {
    it('should return the string if emojis are turned on');

    it('should return the an empty string if emojis are turned off');
  });

  describe('#exec', function() {
    it('should respect the echo option');
  });

  describe('#execs', function() {
    it('should not echo the command regarless of echo option');
  });

  describe('#execo', function() {
    it('should echo the command regarless of echo option');
  });

  describe('#shell', function() {
    it('should execute a shell command');

    it('should let the options be 2nd or 3rd argument');

    it('should respect the echo option');

    it('should respect the suppresstion options');
  });
});
