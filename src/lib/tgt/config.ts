import { Namespace } from '../namespace';

/**
 * The kind of matching to apply to the target name.
 */
export enum TargetMatch {
  Regex = 'regex',
  Glob = 'glob',
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
   *
   * The strings you pass in are formatted against the target name match.
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
   * The input and output files that this target depends on and creates.
   * If any of the inputs are missing, execution is aborted. If any of the outputs
   * are missing, or any of the inputs are newer than the outputs, then the target
   * is executed. If no outputs are specified, the target is always executed.
   * Both properties will use the current working directory as the default base path.
   */
  files?: {
    /**
     * The input files this target depends on. If any are missing, execution is aborted.
     * If any of these files are newer than any of the output files, then the target
     * is executed (it is executed regardless if no output files are given). You can
     * pass `true` to this property to use the target's name.
     *
     * The strings you pass in are formatted against the target name match.
     */
    input?: boolean | string | string[];
    /**
     * The output files this target creates. If any are missing, or any of the input
     * files are newer that any of the output files, then this target is executed. If
     * no input files are given, then only existence is checked. You can pass `true`
     * to this property to use the target's name.
     *
     * The strings you pass in are formatted against the target name match.
     */
    output?: boolean | string | string[];
  };
  /**
   * The list of directories that will be created if they do not already exist.
   * It uses the current working directory. You can pass in full paths and each
   * directory in the path will be checked, and created if it doesn't exist.
   *
   * The strings you pass in are formatted against the target name match.
   */
  directories?: boolean | string | string[];
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
