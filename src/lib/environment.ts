import { SuppressOptions } from './cli/args';
import { Namespace } from './namespace';
import { Options } from './options';
import { Utils } from './utils';

/**
 * The current environment of the Take instance. Contains all the necessary
 * data for targets to be built and ran.
 */
export class Environment {
  /**
   * The root namespace.
   */
  public root: Namespace;
  /**
   * An instance of the utilities class, providing helper functions.
   */
  public utils: Utils;
  /**
   * The current CLI config, overriding the options object.
   */
  public config: {
    /**
     * The outputs to suppress during execution.
     */
    suppress: SuppressOptions[],
    /**
     * Whether emojis should be enabled or disabled.
     */
    emojis?: boolean
  } = {
      suppress: []
    };

  public constructor(
    /**
     * The current options for the execution environment. This is given to the
     * Takefile exported function so it can set up the options for execution.
     */
    public options: Options
  ) {
    this.root = Namespace.getRoot(this);
    this.utils = new Utils(this);
  }
}
