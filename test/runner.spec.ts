import { expect } from 'chai';
import 'mocha';
import { Environment } from '../src/lib/environment';
import { DefaultOptions } from '../src/lib/options';
import { Runner } from '../src/lib/runner';
import { Target, TargetConfigBatch } from '../src/lib/target';

describe('Runner', function() {
  // instance variables
  let env: Environment;
  let conf: TargetConfigBatch;
  let runner: Runner;
  let executions: Array<{
    target: string,
    args: string[]
  }>;

  // helper methods
  function initEach() {
    env = new Environment(DefaultOptions());
    executions = [];

    // build sample config
    const execute = (target: any) => (...args: string[]) => {
      console.log(target, 'fired');
      executions.push({ target: target.toString(), args })
    };
    conf = {
      '': { execute: execute('') },
      1: {
        execute: execute(1),
        children: {
          2: { execute: execute(2) },
          3: { execute: execute(3) },
          4: {
            execute: execute(4),
            children: {
              5: {
                deps: '^:^',
                execute: execute(5)
              },
              6: {
                deps: '7',
                execute: execute(6),
                children: {
                  7: { execute: execute(7) },
                  8: {
                    deps: '^:7',
                    execute: execute(8)
                  }
                }
              },
              9: {
                deps: '^:^:2',
                execute: execute(9)
              }
            }
          }
        }
      },
      10: {
        deps: ':1',
        execute: execute(10)
      },
      11: {
        deps: [':4'],
        execute: execute(11)
      },
      12: {
        deps: [':3'],
        execute: execute(12)
      },
      13: {
        deps: '10',
        execute: execute(13)
      },
      14: {
        deps: ':3',
        execute: execute(14)
      },
      15: {
        deps: ':16',
        execute: execute(15)
      },
      16: {
        deps: ':17',
        execute: execute(16)
      },
      17: {
        execute: execute(17)
      },
      18: {
        deps: [':1'],
        execute: execute(18)
      },
      19: {
        deps: [':1', ':1:2'],
        execute: execute(19)
      },
      20: {
        deps: [':1', ':1'],
        execute: execute(20)
      },
      21: {
        deps: [':1', ':10'],
        execute: execute(21)
      },
    };
    runner = new Runner(env, Target.processTaskConfig(conf, env));
  }

  async function exec(ns: string = '', args?: string[]) {
    let argString = '';
    if (typeof args !== 'undefined') {
      argString = `[${args.join(',')}]`;
    }
    await runner.execute(env.root.resolve(ns + argString));
  }

  describe('#construct', function() {
    beforeEach(initEach);

    it('should construct', function() {
      expect(runner).to.be.an.instanceOf(Runner);
    });
  })

  describe('#execute', function() {
    beforeEach(initEach);

    it('should execute root as empty name target', async function() {
      await exec()

      expect(executions).to.be.eql([
        { target: '', args: [] }
      ]);
    })

    it('should execute top-level complex target', async function() {
      await exec('1');

      expect(executions).to.be.eql([
        { target: '1', args: [] }
      ]);
    })

    it('should execute second-level complex target', async function() {
      await exec(':1:2');

      expect(executions).to.be.eql([
        { target: '2', args: [] }
      ]);
    })

    it('should execute a top-level target with a single string dependent', async function() {
      await exec(':10');

      console.log(executions);
      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '10', args: [] }
      ]);
    });

    it('should execute a top-level target with a single array dependent', async function() {
      await exec(':18');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '18', args: [] }
      ]);
    });

    it('should execute a top-level target with a 2 dependents', async function() {
      await exec(':19');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '2', args: [] },
        { target: '19', args: [] }
      ]);
    });

    it('should execute a top-level target with a 2 dependents that are repeated', async function() {
      await exec(':20');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '20', args: [] }
      ]);
    });

    it('should execute a top-level target with a 2 dependents that have repeated sub-dependents', async function() {
      await exec(':21');

      expect(executions).to.be.eql([
        { target: '1', args: [] },
        { target: '10', args: [] },
        { target: '21', args: [] }
      ]);
    });
  })
});
