#! /usr/bin/env node
import { Take, TakeError } from '../lib';

// run app
Take.runFromCli().catch(err => {
  // to make the exit code slightly useful, exit codes of 1 mean
  // the user did something wrong (and Take exited intentionally),
  // and exit codes of 3 mean Take crashed
  if (TakeError.isTakeError(err)) {
    // if a TakeError was throw, then it was intentional
    err.log();
    process.exitCode = 1;
  } else {
    console.error('Unhandled exception, execution aborted');
    process.exitCode = 3;
  }

  // check trace option and output stack if it is set
  if (err.stack && (global as any).takecli.trace) {
    console.error('Stack trace:');
    console.error(err.stack);
  }
});
