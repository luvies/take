import { Namespace } from './namespace';
import { IOptions } from './options';
import { Utils } from './utils';

export class Environment {
  public ns: Namespace;
  public utils: Utils;

  public constructor(
    public options: IOptions
  ) {
    this.ns = new Namespace(options);
    this.utils = new Utils(this);
  }
}
