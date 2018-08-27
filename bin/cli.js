#! /usr/bin/env node

'use strict';

// load in take
const {
  Take,
  TakeError
} = require('../lib');

async function entry() {
  // create a new Take instance
  const take = await Take.newInstance();

  // run Take
  process.exitCode = await take.cli();
}

// run app
entry().catch(err => {
  if (TakeError.isTakeError(err)) {
    // if a TakeError was throw, then it was intentional
    err.log();
    process.exitCode = 1;
  } else {
    console.error('Unhandled exception, execution aborted');
    console.error(err);
  }
});
