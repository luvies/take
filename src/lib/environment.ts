import { Namespace } from './namespace';
import { IOptions } from './options';

export class Environment {
  public ns: Namespace;

  public constructor(
    public options: IOptions
  ) {
    this.ns = new Namespace(options);
  }
}
