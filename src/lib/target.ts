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
 * A batch of task configs.
 */
export type TargetConfigBatch = Record<string, TargetConfig>;

/**
 * The spec for the task config object.
 */
export interface TargetConfig {
  /**
   * The task description.
   */
  desc?: string;
  /**
   * The dependency or list of dependencies that need to be ran before
   * this task.
   */
  deps?: string | string[];
  /**
   * Whether the dependencies can be executed in parallel.
   */
  parallelDeps?: boolean;
  /**
   * The children tasks of this task. Allows for namespacing.
   */
  children?: TargetConfigBatch;
  /**
   * Whether this task depends on the parent task before it can be run.
   * If the dependencies are run synchronously, then the parent task
   * is ran first.
   */
  depParent?: boolean;
  /**
   * This is set by Take when building the targets, so execute() can dynamically
   * call targets using the current namespace.
   */
  ns?: Namespace;
  /**
   * The function used to perform the task.
   */
  execute?(...args: string[]): void | Promise<void>;
}

/**
 * A batch of tasks.
 */
export type TargetBatch = Record<string, Target>;

/**
 * Contains information about a task and its children, as well and being able to
 * execute it.
 */
export class Target {
  /**
   * Converts the task config into an object that contains all the tasks it declares.
   *
   * @returns The base task set object.
   */
  public static processTaskConfig(config: TargetConfigBatch, env: Environment): TargetBatch {
    const targets: TargetBatch = {};
    for (const name of Object.keys(config)) {
      targets[name] = new Target(name, config[name], env);
    }
    return targets;
  }

  /**
   * The tasks target dependencies.
   */
  public deps: Namespace[] = [];
  /**
   * The child tasks.
   */
  public children: TargetBatch;

  public constructor(
    public name: string,
    private config: TargetConfig,
    env: Environment,
    path?: Namespace
  ) {
    // make sure we have a path
    path = path || env.root;

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

    // if this task depends on its parent, add it
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

    // store the current namespace in the config object, so that the executor can
    // access it via this.ns
    config.ns = path;

    // build the children tasks
    this.children = {};
    if (config.children) {
      for (const child of Object.keys(config.children)) {
        this.children[child] = new Target(child, config.children[child], env, path.resolve(name));
      }
    }
  }

  /**
   * The task's description if it was given.
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

  public get executes(): boolean {
    return !!this.config.execute;
  }

  /**
   * Executes the task's suppied execute function if it was given.
   * If the function returns an awaitable object, it is awaited before returning.
   */
  public async execute(args: string[] = []): Promise<void> {
    if (this.config.execute) {
      // await regardless, since void results can be awaited
      // (they just return immediately)
      await this.config.execute(...args);
    }
  }
}
