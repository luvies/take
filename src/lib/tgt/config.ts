import { Namespace } from '../namespace';

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
