import chalk from 'chalk';
import { formatTree, TreeNode } from 'format-tree';
import * as TakeModule from '.';
import { CliArgs, CliEnv, colors, formatTargetName, printColorInfo, printTargetColorInfo, processArgs } from './cli';
import { Environment } from './environment';
import { Loader } from './loader';
import { Namespace } from './namespace';
import { DefaultOptions, Options } from './options';
import { DependencyNode, Runner } from './runner';
import * as fsp from './shims/fsp';
import { RootTargetIndex, RootTargetName, Target, TargetBatch, TargetConfigBatch } from './target';
import { Utils } from './utils';

/**
 * The spec for the object that is passed into the Takefile exported function.
 */
export type TakefileEnv = Utils & {
  /**
   * The options used to manage the behaviour of various parts of take.
   */
  options: Options,
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
  public static async runFromCli(clienv: CliEnv): Promise<void> {
    // load arguments
    const args: CliArgs = await processArgs();

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
        cenv.config.emojis = args.emojis;

        // store a reference to current env in the cli variable
        clienv.env = cenv;

        // store the env here as well so we can use it
        env = cenv;
      }
    );

    // check meta options before trying to execute tasks
    if (args.listTargets) {
      printTargetColorInfo(env);
      env.utils.log(`${env.utils.useEmoji('🔎  ')}Targets:`);
      env.utils.log(instance.getTargetListString().join('\n'));
    } else if (args.deps) {
      const ns = env.root.resolve(args.deps);
      printTargetColorInfo(env);
      printColorInfo(env, colors.skipped, colors.cyclic);
      env.utils.log(`${env.utils.useEmoji('🔧  ')}Dependency tree:`);
      env.utils.log(instance.getTargetDepTreeString(ns).join('\n'));
    } else {
      // since no option was given that would prevent target execution, run them
      const names: string[] = args.targets;

      // if no target was given, attempt to run the default target
      // if it doesn't exist, then the user has likely done something wrong
      if (!args.targets.length) {
        names.push(env.root.toString());
      }

      // run Take with the given arguments while tracking execution time
      const start = process.hrtime();
      await instance.run(names);
      const [diffSecs, diffNanoSecs] = process.hrtime(start);
      let time: string | number = diffSecs;
      if (time >= 60) {
        time = `${Math.round(diffSecs / 60)}m ${diffSecs % 60}`;
      }
      env.utils.log(chalk.dim(
        `${env.utils.useEmoji('✨  ')}Target executed in ${time}.${diffNanoSecs.toString().slice(0, 2)}s`
      ));
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
    const env = new Environment(DefaultOptions());
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
      await this.runner.execute(this.env.root.resolve(name));
    }
  }

  /**
   * Returns a list of lines that can be printed to list all the targets
   * currently loaded.
   */
  public getTargetListString(): string[] {
    // build target list
    const processTargets = (targets: TargetBatch): TreeNode[] => {
      const nodes: TreeNode[] = [];

      const keys = Object.keys(targets);
      for (const name of keys) {
        // exclude root node
        if (!name) {
          continue;
        }

        // build node
        const target = targets[name];
        const node: TreeNode = {
          text: formatTargetName(target.name, target),
          extra: target.desc
        };

        // build children
        if (Object.keys(target.children).length) {
          node.children = processTargets(
            target.children
          );
        }

        // add node
        nodes.push(node);
      }

      return nodes;
    };

    // build tree
    let tree: TreeNode | TreeNode[] = processTargets(this.targets);
    if (this.targets[RootTargetIndex]) {
      tree = {
        text: formatTargetName(RootTargetName, this.targets[RootTargetIndex]),
        extra: this.targets[RootTargetIndex].desc,
        children: tree
      };
    }

    // return formatted tree
    return formatTree(tree, {
      guideFormat: chalk.dim,
      extraSplit: chalk.dim(' | ')
    });
  }

  /**
   * Returns the list of lines that can be printed to show the dependency tree
   * for a given target.
   */
  public getTargetDepTreeString(ns: Namespace): string[] {
    // build nodes
    const processNode = (depNode: DependencyNode): TreeNode => {
      // build tree node
      let depName;
      if (depNode.cyclic) {
        depName = colors.cyclic.color(depNode.dispName);
      } else if (!depNode.execute) {
        depName = colors.skipped.color(depNode.dispName);
      } else {
        depName = formatTargetName(depNode.dispName, depNode.target);
      }

      const treeNode: TreeNode = {
        text: depName,
        extra: depNode.target.desc,
        children: []
      };

      // build children
      for (const child of depNode.leaves) {
        treeNode.children!.push(processNode(child));
      }

      return treeNode;
    };

    // build tree
    const [depTree] = this.runner.buildDependencyTree(ns);
    return formatTree(processNode(depTree), {
      guideFormat: chalk.dim,
      extraSplit: chalk.dim(' | ')
    });
  }
}
