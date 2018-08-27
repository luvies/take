import { ArgumentParser } from 'argparse';

/**
 * The arguments object spec.
 */
export interface ICliArgs {
  /**
   * The targets to run synchronously in order.
   */
  targets: string[];
  /**
   * Whether to skip target execution and just return the list of targets.
   */
  listTargets: boolean;
}

export function processArgs(): ICliArgs {
  // init argparse object
  const argparser = new ArgumentParser({
    description: 'A TypeScript-based task runner.'
  });

  // build options
  argparser.addArgument(
    ['-l', '--list-targets'],
    {
      action: 'storeTrue',
      defaultValue: false,
      dest: 'listTargets'
    }
  );
  argparser.addArgument(
    'targets',
    {
      nargs: '*'
    }
  );

  return argparser.parseArgs();
}
