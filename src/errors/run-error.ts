/**
 * A custom error used for detecting whether a target failed to execute a command.
 */
export class RunError extends Error {
  /**
   * Returns whether the given variable is an instance of UserError.
   */
  public static isRunError(error: any): error is RunError {
    return typeof error === 'object' && error.name === RunError.name;
  }

  public name: string = RunError.name;

  public constructor(
    message?: string,
    public code?: number
  ) {
    super(message);
  }

  public get hasCode(): boolean {
    return typeof this.code !== 'undefined';
  }

  /**
   * Outputs the error message to the console.
   */
  public log() {
    console.error('Target command failed, reason: ', this.message);
  }
}
