import fs from 'fs';
import * as yargs from 'yargs';

import { log, isTTY, getStdin } from './util';
import * as handlers from './handlers';
import { bisect, estimate } from './bisect';

async function main(args) {
  const { module, interactive } = args;
  console.log(
    [`Check for regression`, module && `in ${module}`]
      .filter(Boolean)
      .join(' '),
  );

  let handler;

  if (interactive) {
    handler = handlers.manual;
  } else if (args.module && fs.existsSync('yarn.lock')) {
    handler = handlers.yarn;
  } else {
    handler = handlers.npm;
  }

  if (typeof handler.beforeAll === 'function') {
    await handler.beforeAll();
  }

  const candidates = await handler.getCandidates(args);

  if (candidates.length === 0) {
    console.error('No candidates found to bisect');
    process.exit(1);
    return;
  }

  const iterations = estimate(candidates);

  console.log(
    `Got ${candidates.length} candidates, will need to check ~ ${iterations} of them\n`,
  );

  await log.clear();

  const { lastGood, firstBad } = await bisect(
    handler.testCandidate,
    candidates,
    args,
  );

  if (!lastGood) {
    console.log(`\nAll candidates failed`);
  } else if (!firstBad) {
    console.log(`\nAll candidates passed`);
  } else {
    console.log(`\nLast good: ${lastGood}\nFirst bad: ${firstBad}`);
  }

  if (typeof handler.afterAll === 'function') {
    await handler.afterAll();
  }
}

yargs
  .scriptName('where-broke')
  .usage('$0 <cmd> [args]')
  .command(
    '$0 [module]',
    'find the version of <module> that broke your tests',
    {
      module: {
        alias: 'm',
        type: 'string',
        describe: 'the module that we are bisecting',
        demand: isTTY,
        positional: true,
      },
      interactive: {
        alias: 'i',
        type: 'boolean',
        describe: 'the values to iterate over, comma separated',
        default: !isTTY,
      },
    },
    main,
  )
  .help().argv;
