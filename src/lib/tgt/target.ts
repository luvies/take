import formatList from 'format-list';
import { sep } from 'path';
import { Environment } from '../environment';
import { Namespace } from '../namespace';
import * as fsp from '../shims/fsp';
import { TakeError } from '../take-error';
import { ExactTargetBatch, GlobTargetBatch, RegexTargetBatch, TargetBatchTree } from './batch';
import { TargetConfig, TargetConfigBatch, TargetMatch } from './config';

/**
 * Contains information about a target and its children, and can perform the execution.
 */
export class Target {
  /**
   * Converts the target config into an object that contains all the targets it declares.
   *
   * @returns The base target set object.
   */
  public static processTargetConfig(config: TargetConfigBatch, env: Environment, path?: Namespace): TargetBatchTree {
    // init batches
    const exact: ExactTargetBatch = {};
    const regex: RegexTargetBatch = [];
    const glob: GlobTargetBatch = [];

    // extract targets
    for (const name of Object.keys(config)) {
      const targetConf = config[name];

      // helper fn
      const getTarget = (tname: string) => new Target(tname, targetConf, env, path);

      switch (targetConf.match) {
        case TargetMatch.Regex:
          // convert string key into regex object
          const match = name.match(/^\/(.*)\/(.*)$/);
          if (!match) {
            throw new TakeError(env, `'${name}' is not a valid RegExp literal`);
          }
          const re = new RegExp(match[1], match[2]);

          regex.push({
            rule: re,
            target: getTarget(name)
          });
          break;
        case TargetMatch.Glob:
          glob.push({
            rule: name,
            target: getTarget(name)
          });
          break;
        default:
          exact[name] = getTarget(name);
          break;
      }
    }

    // create tree batch
    return {
      exact,
      regex,
      glob
    };
  }

  /**
   * The targets target dependencies.
   */
  public deps: Namespace[] = [];
  /**
   * The child targets.
   */
  public children: TargetBatchTree;

  /**
   * The path to get to this target.
   */
  private path: Namespace;
  private files: {
    input: string[];
    output: string[];
  };
  private directories: string[];

  public constructor(
    /**
     * The name of the target. This is the last item in the namespace path.
     */
    public name: string,
    private config: TargetConfig,
    private env: Environment,
    path?: Namespace
  ) {
    // make sure we have a path
    this.path = path = path || env.root;

    // validate target name
    if (!path.isRoot && !name) {
      throw new TakeError(env, 'Empty target name not allowed other than in root config');
    }
    if (name.includes(env.options.namespaceSeparator)) {
      throw new TakeError(env, `Target '${name}' cannot have the namespace separator in`);
    }
    if (name === env.options.namespaceParent) {
      throw new TakeError(env, `'${env.options.namespaceParent}' is not allowed as a target name`);
    }

    // get the base namespace to work dependencies off
    const baseNs = env.options.allDepsAbsolute ? env.root : path.resolve(name);

    // if this target depends on its parent, add it
    // ignore if this is in the root namespace
    if (!path.isRoot && config.depParent) {
      this.deps.push(baseNs.resolve(env.options.namespaceParent));
    }

    // convert the given deps config into an array
    let givenDeps: string[];
    if (Array.isArray(config.deps)) {
      givenDeps = config.deps;
    } else {
      givenDeps = [];
      if (typeof config.deps !== 'undefined') {
        givenDeps.push(config.deps);
      }
    }
    for (const dep of givenDeps) {
      if (dep === '') {
        throw new TakeError(env, 'Dependency cannot be an empty string');
      }
      this.deps.push(baseNs.resolve(dep));
    }

    // convert file options
    this.files = {
      input: [],
      output: []
    };
    if (config.files) {
      if (config.files.input) {
        switch (typeof config.files.input) {
          case 'boolean':
            this.files.input = [name];
            break;
          case 'string':
            this.files.input = [config.files.input as string];
            break;
          case 'object':
            if (Array.isArray(config.files.input)) {
              this.files.input = config.files.input;
            } else {
              throw new TakeError(env, 'files.in can only be a boolean, string or list of strings');
            }
            break;
        }
      }
      if (config.files.output) {
        switch (typeof config.files.output) {
          case 'boolean':
            this.files.output = [name];
            break;
          case 'string':
            this.files.output = [config.files.output as string];
            break;
          case 'object':
            if (Array.isArray(config.files.output)) {
              this.files.output = config.files.output;
            } else {
              throw new TakeError(env, 'files.out can only be a boolean, string or list of strings');
            }
            break;
        }
      }
    }

    // convert directory options
    this.directories = [];
    switch (typeof config.directories) {
      case 'boolean':
        this.directories = [name];
        break;
      case 'string':
        this.directories = [config.directories as string];
        break;
      case 'object':
        if (Array.isArray(config.directories)) {
          this.directories = config.directories;
        } else {
          throw new TakeError(env, 'directories can only be a boolean, string or list of strings');
        }
        break;
    }

    // build the children targets
    this.children = Target.processTargetConfig(config.children || {}, env, path.resolve(name));
  }

  /**
   * The target's description if it was given.
   */
  public get desc(): string | undefined {
    return this.config.desc;
  }

  /**
   * Whether the dependencies should be ran in parallel.
   */
  public get parallelDeps(): boolean {
    return this.config.parallelDeps as boolean;
  }

  /**
   * Returns whether this target has an execute function or not.
   */
  public get executes(): boolean {
    return !!this.config.execute;
  }

  /**
   * Executes the target's suppied execute function if it was given.
   * If the function returns an awaitable object, it is awaited before returning.
   */
  public async execute(match: string[], args: string[] = []): Promise<void> {
    // create a list of directories to check/create in order
    // this is so, for a directory of `a/b`, we check `a`, and then
    // `a/b`, making sure both are created in order
    const dirs: string[] = [];
    for (const dir of this.directories.map(d => formatList(d, match))) {
      const cdirs = [];
      for (const spl of dir.split(sep)) {
        cdirs.push(spl);
        dirs.push(cdirs.join(sep));
      }
    }

    // perform directory check
    for (const dir of dirs) {
      if (!(await fsp.directoryExists(dir))) {
        await fsp.mkdir(dir);
      }
    }

    // perform file in check
    let latestModifyTime: Date | undefined;
    for (const fin of this.files.input.map(f => formatList(f, match))) {
      const [exists, fstats] = await fsp.fileExistsStats(fin);
      if (exists) {
        if (!latestModifyTime || latestModifyTime < fstats!.mtime) {
          latestModifyTime = fstats!.mtime;
        }
      } else {
        throw new TakeError(this.env, `file ${fin} could not be found`);
      }
    }

    // perform file out check
    let shouldExecute: boolean;
    if (this.files.output.length) {
      shouldExecute = false;
      for (const fout of this.files.output.map(f => formatList(f, match))) {
        const [exists, fstats] = await fsp.fileExistsStats(fout);
        if (!exists || (latestModifyTime && fstats!.mtime < latestModifyTime)) {
          shouldExecute = true;
        }
      }
    } else {
      shouldExecute = true;
    }

    // execute the main function if it was defined
    if (shouldExecute && this.config.execute) {
      // create the run data
      this.config.run = {
        ns: this.path,
        match
      };

      // await regardless, since void results can be awaited
      // (they just return immediately)
      await this.config.execute(...args);
    }
  }
}
