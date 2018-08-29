#! /usr/bin/env node
import { Take, TakeError } from '../lib';

async function entry(): Promise<void> {
  // create a new Take instance
  const take = await Take.newInstance();

  // run Take
  process.exitCode = await take.cli();
}

// run app
entry().catch(err => {
  // to make the exit code slightly useful, exit codes of 1 mean
  // the user did something wrong (and Take exited intentionally),
  // and exit codes of 3 mean Take crashed
  if (TakeError.isTakeError(err)) {
    // if a TakeError was throw, then it was intentional
    err.log();
    process.exitCode = 1;
  } else {
    console.error('Unhandled exception, execution aborted');
    console.error(err.stack || err);
    process.exitCode = 3;
  }
});
