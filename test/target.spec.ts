import { expect } from 'chai';
import 'mocha';
import { DefaultOptions, Environment, Target } from '../src/lib';

describe('Task', function() {
  let env: Environment;

  function initEach() {
    env = new Environment(DefaultOptions());
  }

  describe('#constructor', function() {
    beforeEach(initEach);

    it('should work', function() {
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
});
