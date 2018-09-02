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

export type IShellOptions = typeof DefaultShellOptions;

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
   * The default options used for executing commands using the shell utility function.
   * These also apply to exec and its variations unless otherwise stated.
   */
  shell: IShellOptions;
}

export function DefaultOptions(): Options {
  return {
    namespaceSeparator: ':',
    shell: merge({}, DefaultShellOptions)
  };
}
