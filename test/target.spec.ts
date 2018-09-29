import { expect } from 'chai';
import 'mocha';
import { DefaultOptions, Environment, Target } from '../src/lib';

describe('Target', function() {
  let env: Environment;

  function initEach() {
    env = new Environment(DefaultOptions());
  }

  describe('#constructor', function() {
    beforeEach(initEach);

    it('should construct', function() {
      const task = new Target('test', {}, env);
      expect(task).to.be.instanceOf(Target);
    });
  });

  describe('#processTargetConfig', function() {
    beforeEach(initEach);

    it('should process a single empty top-level task', function() {
      const { exact: tasks } = Target.processTargetConfig({
        'target1': {}
      }, env);
      expect(tasks).have.key('target1');
      const task = tasks['target1'];
      expect(task).to.be.instanceOf(Target);
      expect(task.children.exact).to.be.empty;
      expect(task.deps).to.be.empty;
      expect(task.desc).to.be.undefined;
      expect(task.parallelDeps).to.be.not.ok;
    });
  });

  describe('#constructor', function() {
    it('should construct');

    describe('checkers', function() {
      it('should allow empty names in root namespaces');

      it('should error on empty names in non-root namespaces');

      it('should prevent the namespacer from being used in a name');

      it('should prevent the name from being the parent character');
    });

    describe('dependencies', function() {
      it('should make the parent the first dependency if depParent is true');

      it('should properly resolve an array');

      it('should properly resolve a string');

      it('should error on an empty dependency');
    });

    describe('files', function() {
      describe('input', function() {
        it('should use the target\'s name if given true');

        it('should handle a string value');

        it('should handle an array value');
      });

      describe('output', function() {
        it('should use the target\'s name if given true');

        it('should handle a string value');

        it('should handle an array value');
      });
    });

    describe('directories', function() {
      it('should use the target\'s name if given true');

      it('should handle a string value');

      it('should handle an array value');
    });

    it('should process children');
  });

  describe('#desc', function() {
    it('should return the target\'s description');
  });

  describe('#parallelDeps', function() {
    it('should return whether the target can use parallel dependency execution');
  });

  describe('#executes', function() {
    it('should return whether the target executes anything');
  });

  describe('#execute', function() {
    describe('directories', function() {
      it('should create directories that don\'t exist');

      it('should handle path separators properly');
    });

    describe('files', function() {
      describe('input', function() {
        it('should fail if any file doesn\'t already exist');

        it('should execute if all files exist');

        it('should execute if no files are given');
      });

      describe('output', function() {
        it('should execute if any file doesn\'t exist');

        it('should execute if any input file is newer than any of the output files');

        it('should not execute if all of the files exist');

        it('should not execute if all the files are newer than the inputs');
      });
    });

    describe('execution', function() {
      it('should fire the execute function');

      it('should await on the execute function');

      it('should provide runtime info for the execute function');
    });
  });
});
