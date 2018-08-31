import * as TakeModule from '.';
import { ICliArgs, processArgs } from './arguments';
import { Environment } from './environment';
import { Loader } from './loader';
import { IOptions, Options } from './options';
import { Runner } from './runner';
import * as fsp from './shims/fsp';
import { DefaultTaskTarget, Task, TaskBatch, TaskConfigBatch } from './task';
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
 * The main application class.
 */
export class Take {
  /**
   * Creates a Take instance using the command line arguments.
   */
  public static async runFromCli(): Promise<void> {
    // setup the cli global to allow the cli to check options
    // using the global so if errors occur before this function returns,
    // we could still apply some of the options
    (global as any).takecli = {};

    // load arguments
    const args: ICliArgs = await processArgs();

    // process some arguments before creating a Take instance
    if (args.trace) {
      // if trace was passed, enable tracing
      (global as any).takecli.trace = true;
    }
    if (args.cwd) {
      process.chdir(args.cwd);
    }

    // get given path and whether we're using a directory or not
    let path: string | undefined;
    let fromDir: boolean | undefined;
    if (args.file) { // file takes priority
      path = args.file;
      fromDir = false;
    } else if (args.directory) {
      path = args.directory;
      fromDir = true;
    }

    // create a new Take instance
    const instance = await Take.newInstance(
      path, fromDir,
      (env) => {
        // apply cli arguments to config
        env.config.suppress = args.suppress;

        return env;
      }
    );

    // check meta options before trying to execute tasks
    if (args.listTargets) {
      console.log(instance.tasks); // just dump the tasks for now
    } else {
      // since no option was given that would prevent target execution, run them
      const targets: string[] = args.targets;

      // if no target was given, attempt to run the default target
      // if it doesn't exist, then the user has likely done something wrong
      if (!args.targets.length) {
        targets.push(DefaultTaskTarget);
      }

      // run Take with the given arguments
      await instance.run(targets);
    }
  }

  public static async newInstance(
    path?: string,
    fromDir: boolean = true,
    envSetup?: (env: Environment) => Environment
  ): Promise<Take> {
    // set the working directory
    path = path || process.cwd();

    // setup the run environment for Take instance
    let env = new Environment(Options());
    if (envSetup) {
      env = envSetup(env);
    }

    // load Takefile
    const loader: Loader = await (fromDir ? Loader.fromDir(path, env) : Loader.fromFile(path, env));
    const tfEnv = Take.createTakefileEnv(env);
    const taskConf: TaskConfigBatch = await loader.loadConfig(tfEnv);
    const tasks: TaskBatch = Task.processTaskConfig(taskConf, env);
    const runner = new Runner(env, tasks);

    // return new instance
    return new Take(path, env, tasks, runner);
  }

  private static createTakefileEnv(env: Environment): TakefileEnv {
    // make a copy of the utils object so we don't alter the current one
    return Object.assign(new Utils(env),
      {
        options: env.options,
        fsp,
        module: TakeModule
      }
    );
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
    /**
     * The tasks that have been loaded from the Takefile.
     */
    public tasks: TaskBatch,
    /**
     * The runner that can execute the targets.
     */
    public runner: Runner
  ) { }

  /**
   * Runs the given targets synchronously in order.
   *
   * @param targets The targets to run.
   */
  public async run(targets: string[]): Promise<void> {
    // execute the targets against the tasks
    for (const target of targets) {
      await this.runner.execute(target);
    }
  }
}
