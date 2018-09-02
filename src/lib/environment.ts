import { SuppressOptions } from './arguments';
import { Namespace } from './namespace';
import { Options } from './options';
import { Utils } from './utils';

export class Environment {
  public ns: Namespace;
  public utils: Utils;
  public config: {
    suppress: SuppressOptions[],
    emojis?: boolean
  } = {
      suppress: []
    };

  public constructor(
    public options: Options
  ) {
    this.ns = new Namespace(options);
    this.utils = new Utils(this);
  }
}
