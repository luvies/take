import { Environment } from './environment';
import { TakeError } from './take-error';

export const DefaultTaskTarget = 'default';

/**
 * A batch of task configs.
 */
export type TaskConfigBatch = Record<string, TaskConfig>;

/**
 * The spec for the task config object.
 */
export interface TaskConfig {
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
  children?: TaskConfigBatch;
  /**
   * Whether this task depends on the parent task before it can be run.
   * If the dependencies are run synchronously, then the parent task
   * is ran first.
   */
  depParent?: boolean;
  /**
   * The function used to perform the task.
   */
  execute?(...args: string[]): void | Promise<void>;
}

/**
 * A batch of tasks.
 */
export type TaskBatch = Record<string, Task>;

/**
 * Contains information about a task and its children, as well and being able to
 * execute it.
 */
export class Task {
  /**
   * Converts the task config into an object that contains all the tasks it declares.
   *
   * @returns The base task set object.
   */
  public static processTaskConfig(config: TaskConfigBatch, env: Environment): TaskBatch {
    const tasks: TaskBatch = {};
    for (const target in config) {
      if (config.hasOwnProperty(target)) {
        tasks[target] = new Task(target, config[target], env);
      }
    }
    return tasks;
  }

  /**
   * The tasks target dependencies.
   */
  public deps: string[];
  /**
   * The child tasks.
   */
  public children: TaskBatch;

  public constructor(
    name: string,
    private config: TaskConfig,
    private env: Environment,
    containingNamespace?: string
  ) {
    // if the task name has the namespace separator in, error, since it's not allowed
    if (name.indexOf(env.options.namespaceSeparator) >= 0) {
      throw new TakeError('Task name cannot have the namespace separator in');
    }

    // convert the given deps config into an array
    if (Array.isArray(config.deps)) {
      this.deps = config.deps;
    } else {
      this.deps = [];
      if (config.deps) {
        this.deps.push(config.deps);
      }
    }

    // if this task depends on its parent, add it
    // ignore if this is in the root namespace
    if (containingNamespace && config.depParent) {
      this.deps.unshift(containingNamespace);
    } else {
      containingNamespace = '';
    }

    // build the children tasks
    this.children = {};
    if (config.children) {
      const fullName: string = env.ns.join(containingNamespace, name);
      for (const child in config.children) {
        if (config.children.hasOwnProperty) {
          this.children[child] = new Task(child, config.children[child], env, fullName);
        }
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

  /**
   * Executes the task's suppied execute function if it was given.
   * If the function returns an awaitable object, it is awaited before returning.
   */
  public async execute(args: string[] = []): Promise<void> {
    if (this.config.execute) {
      const result = this.config.execute(...args);
      // check if the executor returned anything
      // if it did, make sure it's awaitable, and then await it
      if (result && result.then) {
        await result;
      }
    }
  }
}
