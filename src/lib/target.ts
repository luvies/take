import { Environment } from './environment';
import { Namespace } from './namespace';
import { TakeError } from './take-error';

/**
 * The index of the root target.
 */
export const RootTargetIndex = '';

/**
 * The display name of the root target.
 */
export const RootTargetName = 'root';

/**
 * The kind of matching to apply to the target name.
 */
export enum TargetMatch {
  Regex = 'regex',
  Glob = 'glob'
}

/**
 * A batch of target configs.
 */
export type TargetConfigBatch = Record<string, TargetConfig>;

/**
 * The spec for the target match data.
 */
export interface TargetMatchData {
  /**
   * The full match.
   */
  full: string;
  /**
   * The groups that were matched by the regex matcher. If not using regex, then this
   * will just be an empty list.
   */
  groups: string[];
}

/**
 * The spec for the target config object.
 */
export interface TargetConfig {
  /**
   * How to match the target name. If not given, then the name is matched exactly.
   *
   * Match search order:
   * - exact
   * - regex
   * - glob
   *
   * Valid options:
   * - `regex`
   * - `glob`
   */
  match?: TargetMatch;
  /**
   * The target description.
   */
  desc?: string;
  /**
   * The dependency or list of dependencies that need to be ran before
   * this target.
   */
  deps?: string | string[];
  /**
   * Whether the dependencies can be executed in parallel.
   */
  parallelDeps?: boolean;
  /**
   * The children targets of this target. Allows for namespacing.
   */
  children?: TargetConfigBatch;
  /**
   * Whether this target depends on the parent target before it can be run.
   * If the dependencies are run synchronously, then the parent target
   * is ran first.
   */
  depParent?: boolean;
  /**
   * This is set by Take when building the targets. It contains various properties that
   * describe the current run, like the executing namespace and the matched name
   * (useful for non-exact name matches).
   */
  run?: {
    /**
     * The current namespace that the target is executing in.
     */
    ns: Namespace;
    /**
     * The matched target name. For exact matched targets, this is the same as the target name
     * in the config object, but for dynamically matched targets, it will be the user-provided target
     * name.
     */
    match: TargetMatchData;
  };
  /**
   * The function used to perform the target.
   */
  execute?(...args: string[]): void | Promise<void>;
}

/**
 * A batch of targets that are using exact names.
 */
export type ExactTargetBatch = Record<string, Target>;

/**
 * A regex rule target.
 */
export type RegexTargetBatch = Array<{
  rule: RegExp;
  target: Target;
}>;

/**
 * A glob rule target.
 */
export type GlobTargetBatch = Array<{
  rule: string;
  target: Target;
}>;

/**
 * A tree of target batches.
 */
export interface TargetBatchTree {
  exact: ExactTargetBatch;
  regex: RegexTargetBatch;
  glob: GlobTargetBatch;
}

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

  public constructor(
    /**
     * The name of the target. This is the last item in the namespace path.
     */
    public name: string,
    private config: TargetConfig,
    env: Environment,
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
  public async execute(match: TargetMatchData, args: string[] = []): Promise<void> {
    if (this.config.execute) {
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
