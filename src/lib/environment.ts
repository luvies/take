import { SuppressOptions } from './arguments';
import { Namespace } from './namespace';
import { Options } from './options';
import { Utils } from './utils';

export class Environment {
  public root: Namespace;
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
    this.root = Namespace.getRoot(this);
    this.utils = new Utils(this);
  }
}
