/**
 * A custom error used for detecting whether the user has done something incorrect.
 */
export class UserError extends Error {
  /**
   * Returns whether the given variable is an instance of UserError.
   */
  public static isUserError(error: any): error is UserError {
    return typeof error === 'object' && error.name === UserError.name;
  }

  public name: string = UserError.name;

  /**
   * Outputs the error message to the console.
   */
  public log() {
    console.error('Target failed, reason: ', this.message);
  }
}
