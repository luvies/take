import * as TakeModule from '.';
import { ICliArgs, processArgs } from './arguments';
import { Environment } from './environment';
import { Loader } from './loader';
import { IOptions, Options } from './options';
import { Runner } from './runner';
import * as fsp from './shims/fsp';
import { Task, TaskBatch, TaskConfigBatch } from './task';
import { Utils } from './utils';

/**
 * The spec for the object that is passed into the Takefile exported function.
 */
export type TakefileEnv = Utils & {
  /**
   * The options used to manage the behaviour of various parts of take.
   */
  options: IOptions,
  /**
   * A shim library providing promise-based versions of the functions in the
   * fs library. Once fs.promises comes out of experimental, it is recommened
   * to move to that instead.
   */
  fsp: typeof fsp,
  /**
   * The take module, in case Takefiles wish to write more advanced and custom
   * targets utilising multiple target layers or Takefiles.
   */
  module: typeof TakeModule
};

/**
 * A single target and the arguments to pass to it.
 */
export interface TargetExecData {
  target: string;
  args: string[];
}

/**
 * The main application class.
 */
export class Take {
  public static async newInstance(path?: string, fromDir: boolean = true): Promise<Take> {
    // set the working directory
    path = path || process.cwd();

    // setup the run environment for Take instance
    const env = new Environment(Options());

    // load Takefile
    const loader: Loader = await (fromDir ? Loader.fromDir(path, env) : Loader.fromFile(path, env));
    const builder = await loader.getConfigBuilder();
    const taskConf: TaskConfigBatch = builder(Take.createTakefileEnv(env));
    const tasks: TaskBatch = Task.processTaskConfig(taskConf, env);
    const runner = new Runner(env, tasks);

    // return new instance
    return new Take(path, env, tasks, runner);
  }

  private static createTakefileEnv(env: Environment): TakefileEnv {
    return Object.assign({
      options: env.options as IOptions,
      fsp,
      module: TakeModule
    }, env.utils); // mixin utils
  }

  private constructor(
    /**
     * The directory or Takefile path that this Take instance is using.
     */
    public path: string,
    /**
     * The current environment of the Take instance.
     */
    public env: Environment,
    private tasks: TaskBatch,
    private runner: Runner
  ) { }

  /**
   * Runs the given targets synchronously in order.
   */
  public async run(targets: TargetExecData[]): Promise<void> {
    // execute the targets against the tasks
    for (const target of targets) {
      await this.runner.execute(target.target, target.args);
    }
  }

  /**
   * Runs Take using the command line.
   *
   * @returns The exit code the process should exit with.
   */
  public async cli(): Promise<number> {
    const args: ICliArgs = processArgs();

    // check meta options before trying to execute tasks
    if (args.listTargets) {
      console.log(this.tasks); // just dump the tasks for now
    } else {
      // since no option was given that would prevent target execution,
      // parse them and run them
      const targets: TargetExecData[] = [];
      for (const targetArg of args.targets) {
        // group 1 is the target, group 2 is the arguments
        const match = targetArg.match(/^([^[\]]*)(?:\[([^[\]]*)\])?$/);
        if (match) {
          const targetArgs: string = match[2] || '';
          targets.push({
            target: match[1],
            args: targetArgs.split(',')
          });
        } else {
          console.error(`${targetArg} is not a valid target`);
          return 1;
        }
      }

      // run Take with the given arguments
      this.run(targets);
    }

    // if we get here, it means execution went well, so set the exit code to 0
    return 0;
  }
}
