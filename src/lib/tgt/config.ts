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
     * The match array for the target name. For exact & glob matched targets, it is a length 1
     * array with the full match at index 0, for regex matched targets, it is the RegExpMatchArray
     * object that was matched (i.e. index 0 is the full match, the rest of the list are the groups).
     */
    match: string[];
  };
  /**
   * The function used to perform the target.
   */
  execute?(...args: string[]): void | Promise<void>;
}
