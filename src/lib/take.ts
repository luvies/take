import chalk from 'chalk';
import stringLength from 'string-length';
import * as TakeModule from '.';
import { ICliArgs, processArgs } from './arguments';
import { Environment } from './environment';
import { Loader } from './loader';
import { IOptions, Options } from './options';
import { Runner } from './runner';
import * as fsp from './shims/fsp';
import { DefaultTaskTarget, Target, TargetBatch, TargetConfigBatch } from './target';
import { Utils } from './utils';

export interface ICliEnv {
  trace: boolean;
  env?: Environment;
}

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
   *
   * @param clienv The object used to pass info back out to the cli caller.
   */
  public static async runFromCli(clienv: ICliEnv): Promise<void> {
    // load arguments
    const args: ICliArgs = await processArgs();

    // process some arguments before creating a Take instance
    if (args.trace) {
      // if trace was passed, enable tracing
      clienv.trace = true;
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
    let env!: Environment;
    const instance = await Take.newInstance(
      path, fromDir,
      (cenv) => {
        // apply cli arguments to config
        cenv.config.suppress = args.suppress;

        // store a reference to current env in the cli variable
        clienv.env = cenv;

        // store the env here as well so we can use it
        env = cenv;
      }
    );

    // check meta options before trying to execute tasks
    if (args.listTargets) {
      env.utils.log(chalk.dim('Targets in green have direct executions, dimmed ones do not'));
      env.utils.log('Targets:');
      env.utils.log(instance.getTargetListString().join('\n'));
    } else {
      // since no option was given that would prevent target execution, run them
      const names: string[] = args.targets;

      // if no target was given, attempt to run the default target
      // if it doesn't exist, then the user has likely done something wrong
      if (!args.targets.length) {
        names.push(DefaultTaskTarget);
      }

      // run Take with the given arguments
      await instance.run(names);
    }
  }

  public static async newInstance(
    path?: string,
    fromDir: boolean = true,
    envSetup?: (env: Environment) => void
  ): Promise<Take> {
    // set the working directory
    path = path || process.cwd();

    // setup the run environment for Take instance
    const env = new Environment(Options());
    if (envSetup) {
      envSetup(env);
    }

    // load Takefile
    const loader: Loader = await (fromDir ? Loader.fromDir(path, env) : Loader.fromFile(path, env));
    const tfEnv = Take.createTakefileEnv(env);
    const taskConf: TargetConfigBatch = await loader.loadConfig(tfEnv);
    const targets: TargetBatch = Target.processTaskConfig(taskConf, env);
    const runner = new Runner(env, targets);

    // return new instance
    return new Take(path, env, targets, runner);
  }

  private static createTakefileEnv(env: Environment): TakefileEnv {
    // make a copy of the utils object so we don't alter the current one
    return Object.assign(Utils.copy(env.utils),
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
    public targets: TargetBatch,
    /**
     * The runner that can execute the targets.
     */
    public runner: Runner
  ) { }

  /**
   * Runs the given targets synchronously in order.
   *
   * @param names The names targets to run.
   */
  public async run(names: string[]): Promise<void> {
    // execute the targets against the tasks
    for (const name of names) {
      await this.runner.execute(name);
    }
  }

  /**
   * Returns a list of lines that can be printed to list all the targets
   * currently loaded.
   */
  public getTargetListString(): string[] {
    const toBuild: Array<{ line: string, desc?: string }> = [];

    // build target list
    const processTargets = (targets: TargetBatch, prefix: string) => {
      const keys = Object.keys(targets);
      for (let i = 0; i < keys.length; i++) {
        // shorthands
        const name = keys[i];
        const target = targets[name];

        // set up guide for current target
        let guide: string;
        const last = i === keys.length - 1;
        const hasChildren = Object.keys(target.children).length;
        if (last) {
          guide = '└─';
        } else {
          guide = '├─';
        }
        if (hasChildren) {
          guide += '┬';
        } else {
          guide += '─';
        }
        guide += ' ';

        // build current line
        let line = chalk.dim(prefix + guide);
        if (target.executes) {
          line += chalk.green(name);
        } else {
          line += chalk.dim(name);
        }
        toBuild.push({
          line,
          desc: target.desc
        });

        // build children
        if (hasChildren) {
          processTargets(
            target.children,
            prefix + (last ? ' ' : '│') + ' '
          );
        }
      }
    };
    processTargets(this.targets, '');

    // get the longest name so we can format the descriptions occordingly
    let maxLen = 0;
    for (const item of toBuild) {
      maxLen = Math.max(maxLen, stringLength(item.line));
    }

    // add descriptions and build full output
    const output: string[] = [];
    for (const item of toBuild) {
      let line = item.line;
      if (item.desc) {
        line += ' '.repeat(maxLen - stringLength(item.line)) + chalk.dim(' | ') + item.desc;
      }
      output.push(line);
    }

    return output;
  }
}
