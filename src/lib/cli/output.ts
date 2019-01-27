import chalk from 'chalk';
import { Environment } from '../environment';
import { Target } from '../tgt/target';

/**
 * The structure for the colour data objects.
 */
export interface ColorData {
  color: (str: string) => string;
  desc: string;
}

/**
 * The colours used to denote target types.
 */
export const colors = {
  executes: {
    color: chalk.green,
    desc: chalk`{green Green} {dim targets have an execute function}`,
  } as ColorData,
  depsOnly: {
    color: chalk.blueBright,
    desc: chalk`{blueBright Blue} {dim targets only have dependencies}`,
  } as ColorData,
  noops: {
    color: chalk.magenta,
    desc: chalk`{magenta Magenta} {dim targets don't have an execute function or dependencies}`,
  } as ColorData,
  skipped: {
    color: chalk.dim,
    desc: chalk`{dim Dimmed targets would be skipped}`,
  } as ColorData,
  cyclic: {
    color: chalk.red,
    desc: chalk`{red Red} {dim targets cause a cyclic dependency}`,
  } as ColorData,
};

/**
 * Prints the description of a given colour to stdout.
 *
 * @param env The environment object to log with.
 * @param color The colour data to print the description of.
 */
export function printColorInfo(env: Environment, ...colorData: ColorData[]): void {
  for (const color of colorData) {
    env.utils.log(color.desc);
  }
}

/**
 * Formats the target name using the target object.
 *
 * @param name The target's name.
 * @param target The target to get the info from.
 * @returns The formatted name.
 */
export function formatTargetName(name: string, target: Target): string {
  if (target.executes) {
    return colors.executes.color(name);
  } else if (target.deps.length) {
    return colors.depsOnly.color(name);
  } else {
    return colors.noops.color(name);
  }
}

/**
 * Prints the colour descriptions of the colours that are used with just the target
 * object formatting.
 *
 * @param env The environment object to log with.
 */
export function printTargetColorInfo(env: Environment): void {
  printColorInfo(env, colors.executes, colors.depsOnly, colors.noops);
}
