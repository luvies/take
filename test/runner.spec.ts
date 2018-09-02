import { expect } from 'chai';
import 'mocha';
import { Environment } from '../src/lib/environment';
import { DefaultOptions } from '../src/lib/options';
import { Runner } from '../src/lib/runner';
import { Target, TargetConfigBatch } from '../src/lib/target';

describe('Runner', function(this) {
  // instance variables
  let env: Environment;
  let conf: TargetConfigBatch;
  let runner: Runner;
  let executions: number;

  // helper methods
  function initEach() {
    env = new Environment(DefaultOptions());
    executions = 0;

    // build sample config
    const execute = (...args: string[]) => { executions++ };
    conf = {
      '': { execute },
      1: {
        execute,
        children: {
          2: { execute },
          3: { execute },
          4: {
            execute,
            children: {
              5: {
                deps: '^:^',
                execute
              },
              6: {
                deps: '7',
                execute,
                children: {
                  7: { execute },
                  8: {
                    deps: '^:7',
                    execute
                  }
                }
              },
              9: {
                deps: '^:^:2',
                execute
              }
            }
          }
        }
      },
      10: {
        deps: ':3',
        execute
      },
      11: {
        deps: [':4'],
        execute
      },
      12: {
        deps: [':3'],
        execute
      },
      13: {
        deps: '10',
        execute
      },
    };
    runner = new Runner(env, Target.processTaskConfig(conf, env));
  }

  function exec(ns: string = '', args?: string[]) {
    let argString = '';
    if (typeof args !== 'undefined') {
      argString = `[${args.join(',')}]`;
    }
    runner.execute(env.root.resolve(ns + argString));
  }

  describe('#construct', function(this) {
    beforeEach(initEach);

    it('should construct', function(this) {
      expect(runner).to.be.an.instanceOf(Runner);
    });
  })

  describe('#execute', function(this) {
    beforeEach(initEach);

    it('should execute root as empty name target', function(this) {
      exec()

      expect(executions).to.be.equal(1);
    })

    it('should execute top-level complex target', function(this) {
      exec('1');

      expect(executions).to.be.equal(1);
    })

    it('should execute second-level complex target', function(this) {
      exec(':1:2');

      expect(executions).to.be.equal(1);
    })
  })
});
