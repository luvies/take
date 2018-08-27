/**
 * A custom error used to distinguish between error thrown by Take
 * and unhandled errors due to bad logic.
 */
export class TakeError extends Error {
  /**
   * Returns whether the given variable is an instance of UserError.
   */
  public static isTakeError(error: any): error is TakeError {
    return typeof error === 'object' && error.name === TakeError.name;
  }

  public name: string = TakeError.name;

  public constructor(
    ...messages: any[]
  ) {
    super(messages.join(' '));
  }

  /**
   * Outputs the error message to the console.
   */
  public log() {
    console.error('Error:', this.message);
  }
}
