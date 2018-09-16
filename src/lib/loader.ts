import { join, resolve } from 'path';
import { Environment } from './environment';
import * as fsp from './shims/fsp';
import { TakefileEnv } from './take';
import { TakeError } from './take-error';
import { TargetConfigBatch } from './target';

/**
 * Provides logic to load the Takefile config from the file itself.
 */
export class Loader {
  /**
   * Creates a loader instance from a directory.
   */
  public static async fromDir(dir: string, env: Environment): Promise<Loader> {
    // search for Takefile
    let fpath;
    for (const item of await fsp.readdir(dir)) {
      if (item.match(/Takefile(\.js)?$/i)) {
        fpath = item;
        break;
      }
    }

    // make sure we found it
    if (!fpath) {
      throw new TakeError(env, 'Unable to locate Takefile');
    }

    // create the loader and return it
    return new Loader(join(dir, fpath));
  }

  /**
   * Creates a loader instance from a file.
   */
  public static async fromFile(file: string, env: Environment): Promise<Loader> {
    // make sure file exists
    try {
      await fsp.access(file, fsp.constants.F_OK);
    } catch (err) {
      throw new TakeError(env, 'Given Takefile does not exist');
    }

    // create new loader and return it
    return new Loader(file);
  }

  private constructor(
    private path: string
  ) { }

  /**
   * Loads the config from the Takefile, passing in the TakefileEnv object to the module function.
   */
  public async loadConfig(tfEnv: TakefileEnv): Promise<TargetConfigBatch> {
    // since we're not doing anything fancy yet, just require it normally
    const takefile = require(resolve(this.path));

    // since typescript uses 'default' for exporting by default, check it first
    const builder: (take: TakefileEnv) => TargetConfigBatch | Promise<TargetConfigBatch>
      = takefile.default || takefile;

    // return the builder regardless, since this function can be awaited on
    return builder(tfEnv);
  }
}
