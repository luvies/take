#! /usr/bin/env node

// load in the Take class
const {
  Take
} = require('../lib/take');

async function entry() {
  // create a new Take instance
  take = await Take.newInstance();

  // run Take
  process.exitCode = await take.cli()
}

// run app
entry();
