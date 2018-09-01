import { Environment } from './environment';

/**
 * A custom error used to distinguish between error thrown by Take
 * and unhandled errors due to bad logic.
 */
export class TakeError extends Error {
  /**
   * Returns whether the given variable is an instance of UserError.
   */
  public static isTakeError(error: any): error is TakeError {
    return error instanceof TakeError;
  }

  public name: string = TakeError.name;

  public constructor(
    private env: Environment,
    ...messages: any[]
  ) {
    super(messages.join(' '));
  }

  /**
   * Outputs the error message to the console.
   */
  public log() {
    this.env.utils.logError('Error:', this.message);
  }
}
