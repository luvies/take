import { Environment } from './environment';
import { Namespace } from './namespace';
import { TakeError } from './take-error';
import { Target, TargetBatch } from './target';

interface DependencyNode {
  /**
   * The resolved name of the target.
   */
  name: string;
  /**
   * The target itself.
   */
  target: Target;
  /**
   * The arguments to execute the target with.
   */
  args: string[];
  /**
   * The dependencies to execute first.
   */
  leaves: DependencyNode[];
  /**
   * Whether to actually execute the dependency or not.
   */
  execute: boolean;
  /**
   * Whether this node causes the tree to become cyclic.
   */
  cyclic: boolean;
}

export class Runner {
  public constructor(
    private env: Environment,
    private tasks: TargetBatch
  ) { }

  /**
   * Executes a target against the current task object with optional argument.
   */
  public async execute(target: Namespace): Promise<void> {
    // build dependency tree
    const [tree, safe] = this.buildDependencyTree(target);

    // execute tree
    if (!safe) {
      throw new TakeError(this.env, 'Cyclic target dependency detected, aborting');
    } else {
      await this.execNode(tree);
    }
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
    // if we shouldn't execute this node, don't
    if (!node.execute) {
      return;
    }

    // if we have any leaves, execute them according to the task config
    if (node.leaves) {
      if (node.target.parallelDeps) {
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
    await node.target.execute(node.args);
  }

  /**
   * Constructs the dependency tree. It will take into account multiple occurences
   * of a target and not process them fully.
   *
   * @param ns The target to work off.
   * @param parent The parent node.
   * @param path The path the tree took to get to this node. Used for detecting cyclic dependencies.
   * @param foundTargets The hashmap of found dependencies. Used to ignore dupilcates.
   * @returns The fully constructed node.
   */
  private buildDependencyTree(
    ns: Namespace, parent?: Namespace,
    path: Namespace[] = [], foundTargets: Record<string, boolean> = {}
  ): [DependencyNode, boolean] {
    // get copy of path to prevent mutation
    path = path.slice();

    // if parent was given, add it to the path
    if (parent) {
      path.push(parent);
    }

    // current node
    const [target, args] = this.getTask(ns);
    const node: DependencyNode = {
      name: ns.toString(true),
      target,
      args,
      leaves: [],
      execute: false,
      cyclic: false
    };

    // whether the tree is safe to execute
    let safe = true;

    // only execute the dependency to the tree if we need to
    if (!foundTargets[ns.toString()]) {
      node.execute = true;
      foundTargets[ns.toString()] = true;
    }

    // detect whether this node makes the tree cyclic
    if (path.findIndex(value => value.equalTo(ns)) >= 0) {
      node.cyclic = true;
      safe = false;
    }

    // build leaves
    if (node.target.deps) {
      for (const dep of node.target.deps) {
        // make sure the dependency is valid
        if (dep.isRoot) {
          throw new TakeError(this.env, `${dep} is not a valid dependency`);
        }

        // if we should, build the dependencies
        if (node.execute && !node.cyclic) {
          const [depNode, depSafe] = this.buildDependencyTree(dep, ns, path, foundTargets);
          safe = safe && depSafe;
          node.leaves.push(depNode);
        }
      }
    }

    // return complete node
    return [node, safe];
  }

  /**
   * Converts the target string into the resolved task.
   *
   * @param name The target to search for.
   * @returns The resolved task and its arguments.
   */
  private getTask(name: Namespace): [Target, string[]] {
    if (name.isRoot) {
      if (!this.tasks['']) {
        throw new TakeError(this.env, 'Unable to find default target');
      }
      return [this.tasks[''], name.args];
    } else {
      let ctask: Target | undefined;
      let tasks = this.tasks;
      for (const cns of name.names) {
        if (tasks[cns]) {
          ctask = tasks[cns];
          tasks = ctask.children;
        } else {
          ctask = undefined;
          break;
        }
      }
      if (!ctask) {
        throw new TakeError(this.env, `Unable to find target ${name}`);
      }
      return [ctask, name.args];
    }
  }
}
