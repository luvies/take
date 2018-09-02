import { ArgumentParser } from 'argparse';
import { join } from 'path';
import * as fsp from './shims/fsp';

export enum SuppressOptions {
  Echo = 'echo',
  TakeStdout = 't-stdout',
  TakeStderr = 't-stderr',
  CmdStdout = 'c-stdout',
  CmdStderr = 'c-stderr'
}

enum MetaSuppressOptions {
  Stdout = 'stdout',
  Stderr = 'stderr'
}

/**
 * The arguments object spec.
 */
export interface CliArgs {
  /**
   * The targets to run synchronously in order.
   */
  targets: string[];
  /**
   * Whether to skip target execution and just return the list of targets.
   */
  listTargets: boolean;
  /**
   * The target to display the dependency tree of.
   */
  deps?: string;
  /**
   * The directory to use as the working directory while running Take.
   */
  cwd?: string;
  /**
   * The directory to search for the Takefile.
   * Defaults to the current directory.
   */
  directory?: string;
  /**
   * The full path to the Takefile, with no limits on file names.
   */
  file?: string;
  /**
   * Whether to output the full trace upon errors.
   */
  trace?: boolean;
  /**
   * The outputs to suppress from the Takefile as it executes.
   */
  suppress: SuppressOptions[];
  /**
   * Whether to force emojis on or off.
   */
  emojis?: boolean;
}

export async function processArgs(): Promise<CliArgs> {
  // read package information
  const pgk = JSON.parse(
    await fsp.readFile(join(__dirname, '..', '..', 'package.json'), { encoding: 'utf8' })
  );

  // init argparse object
  const parser = new ArgumentParser({
    description: 'A Promise & TypeScript-based task runner.',
    version: pgk.version,
    prog: 'take'
  });

  // set default here so using type? works as expected
  (parser as any).argumentDefault = undefined;

  // build options
  parser.addArgument(
    ['-l', '--list-targets'],
    {
      help: 'Lists all the targets in the given Takefile',
      action: 'storeTrue',
      defaultValue: false,
      dest: 'listTargets'
    }
  );
  parser.addArgument(
    ['--deps'],
    {
      help: 'Displays the dependency tree of a given target',
      metavar: 'TARGET'
    }
  );
  parser.addArgument(
    ['-c', '--cwd'],
    {
      help: 'The directory to set as the working directory before searching and executing the Takefile.'
    }
  );
  parser.addArgument(
    ['-d', '--directory'],
    {
      help: 'The path to the directory containing a Takefile. Defaults to the current directory.'
    }
  );
  parser.addArgument(
    ['-f', '--file'],
    {
      help: 'The full path to the Takefile. The file can have any name, as long as it exists. ' +
        'If this argument is given along with the directory argument, this one takes priority.'
    }
  );
  parser.addArgument(
    ['-t', '--trace'],
    {
      help: 'Whether to output a full trace upon errors.',
      action: 'storeTrue',
      defaultValue: false,
    }
  );
  parser.addArgument(
    ['--suppress'],
    {
      help: 'The output types to suppress (can be multiple --suppress or comma separated). ' +
        'echo: supresses the printing of the commands back to the console just before execution. ' +
        't-stdout: supresses the stdout of Take. ' +
        't-stderr: supresses the stderr of Take. ' +
        'c-stdout: supresses the stdout of the commands. ' +
        'c-stderr: supresses the stderr of the commands. ' +
        'stdout: same as using both t-stdout and c-stdout. ' +
        'stderr: same as using both t-stderr and c-stderr.',
      action: 'append',
      defaultValue: [],
      metavar: 'OUTPUT'
    }
  );
  parser.addArgument(
    ['--emojis'],
    {
      help: 'Whether to force Take to use or disable emojis.',
      choices: ['on', 'off'],
      metavar: '{on,off}'
    }
  );
  parser.addArgument(
    'targets',
    {
      help: 'The targets to execute from the given Takefile. ' +
        'They will be executed in the order they are given.',
      nargs: '*'
    }
  );

  const args = parser.parseArgs();

  // convert suppress options to single array
  let suppress: string[] = (args.suppress as string[])
    .map(value => value.split(','))
    .reduce((arr, value) => arr.concat(value), []);

  // make sure only allowed options are given
  const suppressAllowed: string[] = [
    ...Object.keys(SuppressOptions).map(key => (SuppressOptions as any)[key]),
    ...Object.keys(MetaSuppressOptions).map(key => (MetaSuppressOptions as any)[key])
  ];
  for (const sop of suppress) {
    if (!suppressAllowed.includes(sop)) {
      parser.error(
        'argument --suppress: Invalid option, allowed options:\n' +
        `[${suppressAllowed.join(', ')}]\n` +
        'multiple --suppress flags can be given, and each can have\n' +
        'a list of comma-separated options'
      );
    }
  }

  // convert meta-options to regular ones
  if (suppress.includes(MetaSuppressOptions.Stdout)) {
    suppress.push(SuppressOptions.CmdStdout);
    suppress.push(SuppressOptions.TakeStdout);
    suppress = suppress.filter(value => value !== MetaSuppressOptions.Stdout);
  }
  if (suppress.includes(MetaSuppressOptions.Stderr)) {
    suppress.push(SuppressOptions.CmdStderr);
    suppress.push(SuppressOptions.TakeStderr);
    suppress = suppress.filter(value => value !== MetaSuppressOptions.Stderr);
  }
  args.suppress = suppress.filter((value, i) => suppress.indexOf(value) === i);

  // apply emoji argument
  if (typeof args.emojis !== 'undefined') {
    args.emojis = args.emojis === 'on';
  }

  return args;
}
