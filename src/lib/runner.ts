import { Environment } from './environment';
import { TakeError } from './take-error';
import { Task, TaskBatch } from './task';

interface DependencyNode {
  target: string;
  task: Task;
  args: string[];
  leaves: DependencyNode[];
}

export class Runner {
  public constructor(
    private env: Environment,
    private tasks: TaskBatch
  ) { }

  /**
   * Executes a target against the current task object with optional argument.
   */
  public async execute(target: string): Promise<void> {
    // build dependency tree
    const tree = this.buildDependencyTree(target);

    // execute tree
    await this.execNode(tree);
  }

  /**
   * Executes a node.
   * Will execute its dependencies first, taking into account whether the node's
   * task config wanted it to be in parallel or not.
   *
   * @param node The node to execute.
   * @param args The argument to pass to the node's target.
   */
  private async execNode(node: DependencyNode): Promise<void> {
    // if we have any leaves, execute them according to the task config
    if (node.leaves) {
      if (node.task.parallelDeps) {
        // execute the leaves in parallel
        const deps: Array<Promise<void>> = [];
        for (const leaf of node.leaves) {
          deps.push(this.execNode(leaf));
        }

        // wait for all to complete
        await Promise.all(deps);
      } else {
        // execute the leaves in sequence
        for (const leaf of node.leaves) {
          await this.execNode(leaf);
        }
      }
    }

    // now the dependencies are done, execute the node itself
    await node.task.execute(node.args);
  }

  /**
   * Constructs the dependency tree. It will take into account multiple occurences
   * of a target and ignore them.
   *
   * @param target The target to work off.
   * @param parent The parent node.
   * @param path The path the tree took to get to this node. Used for detecting cyclic dependencies.
   * @param foundTargets The hashmap of found dependencies. Used to ignore dupilcates.
   * @returns The fully constructed node.
   */
  private buildDependencyTree(
    target: string, parent?: string,
    path: string[] = [], foundTargets: Record<string, boolean> = {}
  ): DependencyNode {
    // get copy of path to prevent mutation
    path = path.slice();

    // if parent was given, add it to the path
    if (parent) {
      path.push(parent);
    }

    // current node
    const [task, args] = this.getTask(target);
    const node: DependencyNode = {
      target,
      task,
      args,
      leaves: []
    };

    // build leaves
    if (node.task.deps) {
      for (const dep of node.task.deps) {
        // only attempt to add the dependency to the tree if we need to
        if (!foundTargets[dep]) {
          // make sure we don't loop
          if (path.indexOf(dep) >= 0) {
            path.push(target);
            path.push(dep);
            throw new TakeError(
              `Cyclic target dependency detected, aborting (dependency path: ${path.join(' -> ')})`
            );
          } else {
            // since the dependency hasn't been encountered before, and we are in a valid state,
            // we can build and add it to leaves
            foundTargets[dep] = true; // make sure we mark it as found
            node.leaves.push(this.buildDependencyTree(dep, target, path, foundTargets));
          }
        }
      }
    }

    // return complete node
    return node;
  }

  /**
   * Converts the target string into the resolved task.
   *
   * @param target The target to search for.
   * @returns The resolved task and its arguments.
   */
  private getTask(target: string): [Task, string[]] {
    let ctask: Task | undefined;
    let tasks = this.tasks;
    const extract = this.env.ns.extractArgs(target);
    if (!extract) {
      throw new TakeError(`${target} is not a valid target`);
    }
    const [name, args] = extract;
    const nss = this.env.ns.split(name);
    for (const cns of nss) {
      if (tasks[cns]) {
        ctask = tasks[cns];
        tasks = ctask.children;
      } else {
        ctask = undefined;
        break;
      }
    }
    if (!ctask) {
      throw new TakeError(`Unable to find target ${target}`);
    }
    return [ctask, args];
  }
}
