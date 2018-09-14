import { SpawnOptions } from 'child_process';
import merge from 'deepmerge';

/**
 * The default shell options object.
 */
const DefaultShellOptions = {
  /**
   * Whether to echo the command to the console.
   * @default false
   */
  echo: false,
  /**
   * The string to prefix the command echo with.
   * @default '> '
   */
  echoPrefix: '> ',
  /**
   * The string to suffix the command echo with.
   *  @default ''
   */
  echoSuffix: '',
  /**
   * Whether to throw an error if the command return an exit code that isn't 0.
   * If true, it will mean that all commands that use {@link Utils#shell} will
   * reject their promises upon a bad error code. If false, they will resolve normally
   * into the exit code.
   * @default true
   */
  abortOnErrorCode: true,
  /**
   * Whether to print the command's stdout to the console.
   * @default false
   */
  printStdout: false,
  /**
   * Whether to print the command's stderr to the console.
   * @default false
   */
  printStderr: false,
  /**
   * The default options to pass into spawn.
   */
  spawn: {
    shell: true
  } as SpawnOptions
};

export type ShellOptions = typeof DefaultShellOptions;

/**
 * The spec for the options object.
 */
export interface Options {
  /**
   * The character used to separate the namespace names.
   * @default ':'
   * @example
   * module.exports = {
   *   'parent': {
   *     desc: 'Parent task',
   *     children: {
   *       'child': {
   *         desc: 'Child task'
   *       }
   *     }
   *   }
   * }
   * // child task can be accessed with `parent:child`
   */
  namespaceSeparator: string;
  /**
   * The character used to refer to the namespace's containing namespace
   * (i.e. the target's parent).
   * @default '^'
   * @example
   * ':target1:target2:target3:^' === ':target1:target2'
   * ':target1:target2:target3:^:^' === ':target1'
   */
  namespaceParent: string;
  /**
   * The default options used for executing commands using the shell utility function.
   * These also apply to exec and its variations unless otherwise stated.
   */
  shell: ShellOptions;
  /**
   * Whether to use ✨ emojis ✨ in terminal output.
   * The default is environment dependant, since not everything supports emojis.
   * @default process.stdout.isTTY && process.platform === 'darwin'
   */
  emojis: boolean;
  /**
   * Whether all dependencies are resolved as if they are absolute dependencies
   * (i.e. they all have the namespace separator prefixed automatically).
   * WARNING: This will mean that you will *not* be able to use relative dependencies at all.
   * @default false
   */
  allDepsAbsolute: boolean;
}

export function DefaultOptions(): Options {
  return {
    namespaceSeparator: ':',
    namespaceParent: '^',
    shell: merge({}, DefaultShellOptions),
    emojis: !!process.stdout.isTTY && process.platform === 'darwin',
    allDepsAbsolute: false
  };
}
