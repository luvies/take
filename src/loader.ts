import { join } from 'path';
import { Environment } from './environment';
import * as fsp from './shims/fsp';
import { TakefileEnv } from './take';
import { TakeError } from './take-error';
import { TaskConfigBatch } from './task';

export class Loader {
  public static async fromDir(dir: string, env: Environment): Promise<Loader> {
    // search for Takefile
    let fpath;
    for (const item of await fsp.readdir(process.cwd())) {
      if (item.match(/Takefile(\.js)?$/i)) {
        fpath = item;
        break;
      }
    }

    // make sure we found it
    if (!fpath) {
      throw new TakeError('Unable to locate Takefile');
    }

    // create the loader and return it
    return new Loader(join(dir, fpath), env);
  }

  public static async fromFile(file: string, env: Environment): Promise<Loader> {
    // make sure file exists
    try {
      await fsp.access(file, fsp.constants.F_OK);
    } catch (err) {
      throw new TakeError('Given Takefile does not exist');
    }

    // create new loader and return it
    return new Loader(file, env);
  }

  private constructor(
    private path: string,
    private env: Environment
  ) { }

  public async getConfigBuilder(): Promise<(take: TakefileEnv) => TaskConfigBatch> {
    // since we're not doing anything fancy yet, just require it normally
    // this function is async since it will be reading and processing later on
    const takefile = require(this.path);
    // since typescript uses 'default' for exporting by default,
    // check it first
    return takefile.default || takefile;
  }
}
