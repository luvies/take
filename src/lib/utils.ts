import { spawn } from 'child_process';
import merge from 'deepmerge';
import { SuppressOptions } from './arguments';
import { Environment } from './environment';
import { IShellOptions } from './options';
import { TakeError } from './take-error';

// since this class is purely for mixing into the TakefileEnv object,
// the private members are all prefixed with `__` to reduce the pollution
// of the object.
/**
 * Provides various utilities that Takefiles can make use of.
 */
export class Utils {
  public static copy(old: Utils): Utils {
    return new Utils(old.__env);
  }

  public constructor(
    // tslint:disable-next-line:variable-name
    private __env: Environment
  ) { }

  /**
   * Logs a message to stdout, applying the current environment to it beforehand.
   * This will abide by the suppress options.
   *
   * @param messages The list of objects to print.
   */
  public log(...messages: any[]): void {
    if (
      !this.__env.config.suppress.includes(SuppressOptions.TakeStdout)
    ) {
      // tslint:disable-next-line:no-console
      console.log(...messages);
    }
  }

  /**
   * Logs a message to stderr, applying the current environment to it beforehand.
   * This will abide by the suppress options.
   *
   * @param messages The list of objects to print.
   */
  public logError(...messages: any[]): void {
    if (
      !this.__env.config.suppress.includes(SuppressOptions.TakeStderr)
    ) {
      // tslint:disable-next-line:no-console
      console.error(...messages);
    }
  }

  /**
   * Executes a given command, respecting `shellOptions.echo`.
   */
  public exec(...cmd: string[]): Promise<number> {
    return this.__exec(cmd);
  }

  /**
   * Executes a given command, supressing the command echo to the console
   * *regardless* of what `shellOptions.echo` is set to.
   */
  public execs(...cmd: string[]): Promise<number> {
    return this.__exec(cmd, false);
  }

  /**
   * Executes a given command, forcing the command echo to the console
   * *regardless* of what `shellOptions.echo` is set to.
   */
  public execo(...cmd: string[]): Promise<number> {
    return this.__exec(cmd, true);
  }

  /**
   * Provides a promise-based version of child_process.spawn that takes into
   * account the current `shellOptions`. The `opts` object will both be passed
   * to spawn to allow detailed config, and will be used to override the current
   * `shellOptions`.
   *
   * @param cmd The command to execute.
   * @param args The arguments to pass to spawn. If this is not an array, it will be used as
   * the `opts` parameter, and the actual `opts` parameter will be ignored.
   * @param opts The options to pass to spawn and to use to override `shellOptions`. Ignored if
   * `args` is not an array.
   */
  public shell(cmd: string, args?: string[] | Partial<IShellOptions>, opts?: Partial<IShellOptions>): Promise<number> {
    // if the opts argument was passed in second, reorganise parameters
    if (!Array.isArray(args)) {
      opts = args;
      args = [];
    }

    // merge global options with given options
    const copts = merge(this.__env.options.shell, opts || {});
    const spawnOpts = copts.spawn || {}; // spawn options

    // setup stdio
    // we override any options given since we need to tap into it
    spawnOpts.stdio = [
      'inherit',
      'pipe',
      'pipe'
    ];

    // launch and setup process
    if (!this.__env.config.suppress.includes(SuppressOptions.Echo) && copts.echo) {
      // if we are echoing to console, do that now
      const fmtargs = args ? ` ${args.map(arg => `'${arg.replace('\'', '\\\'')}'`).join(' ')}` : '';
      // tslint:disable-next-line:no-console
      console.log(`${copts.echoPrefix}${cmd}${fmtargs}${copts.echoSuffix}`);
    }
    const proc = spawn(cmd, args, spawnOpts);

    // set up stdout if we were configured to
    if (
      !this.__env.config.suppress.includes(SuppressOptions.CmdStdout) &&
      copts.printStdout
    ) {
      proc.stdout.on('data', (chunk: Buffer) => this.__handlePipeData(process.stdout, chunk));
    }

    // set up stderr if we were configured to
    if (
      !this.__env.config.suppress.includes(SuppressOptions.CmdStderr) &&
      copts.printStderr
    ) {
      proc.stderr.on('data', (chunk: Buffer) => this.__handlePipeData(process.stderr, chunk));
    }

    // set up exit/error events on child process in a containing promise and return it
    return new Promise<number>((resolve, reject) => {
      proc.on('exit', code => {
        // if we abort on error code, then reject non 0 codes
        if (copts.abortOnErrorCode) {
          if (code === 0) {
            resolve(code);
          } else {
            reject(new TakeError(this.__env, 'Target execution aborted: process exited with code', code));
          }
        } else {
          // otherwise just resolve regardless
          resolve(code);
        }
      });

      proc.on('error', err => {
        reject(err);
      });
    });
  }

  /**
   * Internal method for the exec variations.
   */
  private async __exec(cmd: string[], echo?: boolean): Promise<number> {
    if (cmd.length) {
      // if we were given the base command, run it
      return this.shell(cmd[0], cmd.slice(1), typeof echo !== 'undefined' ? { echo } : undefined);
    } else {
      // if nothing was given, act as a noop
      return 0;
    }
  }

  private __handlePipeData(stream: NodeJS.WriteStream, data: Buffer) {
    // for now just pass thru the data
    stream.write(data.toString());
  }
}
