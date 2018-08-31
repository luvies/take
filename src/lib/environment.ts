import { SuppressOptions } from './arguments';
import { Namespace } from './namespace';
import { IOptions } from './options';

export class Environment {
  public ns: Namespace;
  public config: {
    suppress: SuppressOptions[]
  } = {
      suppress: []
    };

  public constructor(
    public options: IOptions
  ) {
    this.ns = new Namespace(options);
  }
}
