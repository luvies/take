import { expect } from 'chai';
import 'mocha';
import { DefaultOptions, Environment, Runner, Target, TargetConfigBatch } from '../prebuild/lib';
import { runnerSample } from './runner-helpers';

describe('Runner', function() {
  // instance variables
  let env: Environment;
  let conf: TargetConfigBatch;
  let runner: Runner;
  let executions: Array<{
    target: string,
    args: string[],
  }>;

  // helper methods
  beforeEach(function() {
    env = new Environment(DefaultOptions());
    executions = [];

    // build sample config
    const execute = (target: any) => (...args: string[]) => {
      executions.push({ target: target.toString(), args });
    };
    conf = runnerSample(execute);
    runner = new Runner(env, Target.processTargetConfig(conf, env));
  });

  async function exec(ns = '', args?: string[]) {
    let argString = '';
    if (typeof args !== 'undefined') {
      argString = `[${args.join(',')}]`;
    }
    await runner.execute(env.root.resolve(ns + argString));
  }

  describe('#constructor', function() {
    it('should construct', function() {
      expect(runner).to.be.an.instanceOf(Runner);
    });
  });

  describe('#execute', function() {
    it('should execute root as empty name target', async function() {
      await exec();

      expect(executions).to.be.eql([
        { target: '', args: [] },
      ]);
    });

    it('should execute top-level complex target', async function() {
      await exec('1');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
      ]);
    });

    it('should execute second-level complex target', async function() {
      await exec(':1:2');

      expect(executions).to.be.eql([
        { target: '2', args: [] },
      ]);
    });

    it('should execute a top-level target with a single string dependent', async function() {
      await exec(':10');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '10', args: [] },
      ]);
    });

    it('should execute a top-level target with a single array dependent', async function() {
      await exec(':18');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '18', args: [] },
      ]);
    });

    it('should execute a top-level target with a 2 dependents', async function() {
      await exec(':19');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '2', args: [] },
        { target: '19', args: [] },
      ]);
    });

    it('should execute a top-level target with a 2 dependents that are repeated', async function() {
      await exec(':20');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '20', args: [] },
      ]);
    });

    it('should execute a top-level target with a 2 dependents that have repeated sub-dependents', async function() {
      await exec(':21');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '10', args: [] },
        { target: '21', args: [] },
      ]);
    });
  });

  describe('#buildDependencyTree', function() {
    it('should not mutate the path');

    it('should build up a correctly ordered tree');

    it('should not allow the execution of repeated dependencies');

    it('should detect cyclic dependencies and return a false safe value');
  });
});
