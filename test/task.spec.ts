import { expect } from 'chai';
import 'mocha';
import { Environment } from '../src/lib/environment';
import { Options } from '../src/lib/options';
import { Task } from '../src/lib/task';

describe('Task', function(this) {
  let env: Environment;

  function initEach() {
    env = new Environment(Options());
  }

  describe('#constructor', function(this) {
    beforeEach(initEach);

    it('should work', function(this) {
      const task = new Task('test', {}, env);
      expect(task).to.be.instanceOf(Task);
    });
  });

  describe('#processTaskConfig', function(this) {
    beforeEach(initEach);

    it('should process a single empty top-level task', function(this) {
      const tasks = Task.processTaskConfig({
        'target1': {}
      }, env);
      expect(tasks).have.key('target1');
      const task = tasks['target1'];
      expect(task).to.be.instanceOf(Task);
      expect(task.children).to.be.empty;
      expect(task.deps).to.be.empty;
      expect(task.desc).to.be.undefined;
      expect(task.parallelDeps).to.be.not.ok;
    });
  });
});
