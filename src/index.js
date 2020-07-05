#! /usr/bin/env node
import fetch from 'isomorphic-fetch';
import ora from 'ora';
import * as yargs from 'yargs';

import { log, exec } from './util';
import npm from './handlers/npm';

import { bisect, estimate } from './bisect';

async function main(args) {
  const { module, interactive } = args;
  console.log(`Check for regression in ${module}\n`);


  spinner.text = `${pkg} testing`;
  const candidates = await npm.getCandidates(args);

  if (candidates.length === 0) {
    console.error('No candidates found to bisect');
    process.exit(1);
    return;
  }

  const iterations = estimate(candidates);

  console.log(
    `Got ${candidates.length} candidates, will need to check ${iterations} of them\n`,
  );

  await log.clear();

  const { lastGood, firstBad } = await bisect(
    npm.testCandidate,
    candidates,
    args,
  );

  console.log(`\nThe tests passed in ${lastGood} and fail since ${firstBad}`);
}

yargs
  .scriptName('where-broke')
  .usage('$0 <cmd> [args]')
  .command(
    '$0 <module>',
    'find the version of <module> that broke your tests',
    {
      module: {
        alias: 'm',
        type: 'string',
        describe: 'the module that we are bisecting',
        demand: true,
        positional: true,
      },
    },
    main,
  )
  .help().argv;
