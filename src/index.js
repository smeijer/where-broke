#! /usr/bin/env node
import fetch from 'isomorphic-fetch';
import ora from 'ora';
import * as yargs from 'yargs';

import { log, exec } from './util';

import { bisect, estimate } from './bisect';

async function test(pkg) {
  const spinner = ora(`${pkg} installing`).start();

  await exec(`npm install ${pkg} --no-save --no-audit`);

  spinner.text = `${pkg} testing`;

  try {
    await exec('npm run test');
    spinner.succeed(`${pkg}`);
    return true;
  } catch (ex) {
    log.log(ex.stderr + '\n\n' + '-'.repeat(70) + '\n\n');
    spinner.fail(`${pkg}`);
    return false;
  }
}

async function main({ lib }) {
  console.log(`Check for regression in ${lib}\n`);

  const spinner = ora(`Fetch version`).start();

  const response = await fetch(`https://registry.npmjs.org/${lib}`);

  const data = await response.json();
  if (!data.versions) {
    spinner.fail('This package does not have any versions on npm :/');
    process.exit(1);
  }

  const versions = Object.keys(data.versions);

  const iterations = estimate(versions);

  spinner.info(
    `Found ${versions.length} versions, will need to test ${iterations} of them\n`,
  );

  await log.clear();

  const { lastGood, firstBad } = await bisect(
    (version) => test(`${lib}@${version}`),
    versions,
  );

  console.log(`\n  The tests passed in ${lastGood} and fail since ${firstBad}`);
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
    (argv) => {
      return main({ lib: argv.module });
    },
  )
  .help().argv;
