#! /usr/bin/env node
import { Environment, ICliEnv, Take, TakeError } from '../lib';

function logError(env?: Environment, ...messages: any[]) {
  if (env) {
    env.utils.logError(...messages);
  } else {
    // tslint:disable-next-line:no-console
    console.log(...messages);
  }
}

// run app
const clienv: ICliEnv = {
  trace: false
};
Take.runFromCli(clienv).catch(err => {
  // to make the exit code slightly useful, exit codes of 1 mean
  // the user did something wrong (and Take exited intentionally),
  // and exit codes of 3 mean Take crashed
  if (TakeError.isTakeError(err)) {
    // if a TakeError was thrown, then it was intentional
    err.log();
    process.exitCode = 1;
  } else {
    logError(clienv.env, 'Unhandled exception, execution aborted');
    process.exitCode = 3;
  }

  // check trace option and output stack if it is set
  if (err.stack && clienv.trace) {
    logError(clienv.env, 'Stack trace:');
    logError(clienv.env, err.stack);
  }
});
