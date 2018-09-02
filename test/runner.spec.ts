import { expect } from 'chai';
import 'mocha';
import { Environment } from '../src/lib/environment';
import { Options } from '../src/lib/options';
import { Runner } from '../src/lib/runner';
import { Target, TargetBatch } from '../src/lib/target';

describe('Runner', function(this) {
  // instance variables
  let env: Environment;
  let conf: TargetBatch;
  let runner: Runner;
  let executions: number;

  // helper methods
  function initEach() {
    env = new Environment(Options());
    conf = {};
    executions = 0;
  }

  function loopTargets(start: number, end: number, fn: (tgt: number) => void) {
    for (let i = start; i <= end; i++) {
      fn(i);
    }
  }

  function addTask(...tgtNs: number[]): void {
    const namespace: string[] = tgtNs.map(tgt => tgts[tgt]);
    let crecord = conf;
    for (let i = 0; i < namespace.length - 1; i++) {
      crecord = conf[namespace[i]].children;
    }
    const target = namespace[namespace.length - 1];
    let containingNamespace: string | undefined;
    if (namespace.length > 1) {
      containingNamespace = env.ns.join(...namespace.slice(0, namespace.length - 1))
    }
    crecord[target] = new Target(target, {
      execute() {
        executions++;
      }
    }, env, containingNamespace);
  }

  function initRunner(): void {
    runner = new Runner(env, conf);
  }

  function exec(namespace: number[], args: string[] = []) {
    runner.execute(env.ns.join(...namespace.map(tgt => tgts[tgt])));
  }

  // helper variables
  const maxTgts = 6;
  const tgts: Record<number, string> = {}
  loopTargets(0, maxTgts, i => tgts[i] = `target${i}`);

  // test management
  beforeEach(initEach);

  // tests
  it('should construct', function(this) {
    initRunner();
    expect(runner).to.be.an.instanceOf(Runner);
  });

  it('should execute top-level target in single-item config', function(this) {
    addTask(0);
    initRunner();
    exec([0]);

    expect(executions).to.be.equal(1);
  })

  it('should execute top-level target in multi-item config', function(this) {
    loopTargets(0, maxTgts, i => addTask(i));
    initRunner();
    exec([2]);

    expect(executions).to.be.equal(1);
  })

  it('should execute second-level target in single then single-item config', function(this) {
    addTask(0);
    addTask(0, 1);
    initRunner();
    exec([0, 1]);

    expect(executions).to.be.equal(1);
  })
});
