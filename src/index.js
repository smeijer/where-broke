#! /usr/bin/env node
const fs = require("fs");
const util = require("util");
const child = require("child_process");
const fetch = require("isomorphic-fetch");
const ora = require("ora");

const exec = util.promisify(child.exec);
const write = util.promisify(fs.writeFile);
const append = util.promisify(fs.appendFile);
const logfile = "where-broke.log";

async function test(pkg) {
  const spinner = ora(`${pkg} installing`).start();

  await exec(`npm install ${pkg} --no-save --no-audit`);

  spinner.text = `${pkg} testing`;

  try {
    await exec("npm run test");
    spinner.succeed(`${pkg}`);
    return true;
  } catch (ex) {
    append(logfile, ex.stderr + "\n\n" + "-".repeat(70) + "\n\n");
    spinner.fail(`${pkg}`);
    return false;
  }
}

async function main({ lib }) {
  console.log(`Check for regression in ${lib}\n`);

  const spinner = ora(`Fetch version`).start();

  const response = await fetch(`https://registry.npmjs.org/${lib}`);
  await write(logfile, "");

  const data = await response.json();
  const versions = Object.keys(data.versions);

  const iterations = Math.ceil(Math.log2(versions.length));

  spinner.info(
    `Found ${versions.length} versions, will need to test ${iterations} of them\n`
  );

  let from = 0;
  let to = versions.length - 1;

  while (from <= to) {
    const mid = Math.floor((from + (to + 1)) / 2);
    const version = versions[mid];

    const passed = await test(`${lib}@${version}`);

    if (passed) {
      from = mid + 1;
    } else {
      to = mid - 1;
    }
  }

  console.log(
    `\n  The tests passed in ${versions[to]} and fail since ${versions[from]}`
  );
}

const [lib] = Array.from(process.argv).slice(2);

if (!lib) {
  console.log(`
  no package name provided, please provide a package name:\n
  
    > npx where-broke @testing-library/dom
`);
  process.exit(0);
}

main({ lib });
