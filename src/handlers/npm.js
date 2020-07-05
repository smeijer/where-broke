import ora from 'ora';
import fetch from 'isomorphic-fetch';
import { exec, log } from '../util';

async function getCandidates({ module }) {
  console.log(`Fetch version data from registry.npmjs.org`);

  const response = await fetch(`https://registry.npmjs.org/${module}`);
  const data = await response.json();

  return Object.keys(data.versions || {});
}

async function testCandidate(candidate, attempt, { module }) {
  const name = `${module}@${candidate}`;

  const spinner = ora(`install  ${name}`).start();
  await exec(`npm install ${name} --no-save --no-audit`);

  try {
    spinner.text = `testing  ${name}`;
    await exec('npm run test');
    spinner.succeed(`accepted ${name}`);
    return true;
  } catch (ex) {
    await log.log(ex.stderr + '\n\n' + '-'.repeat(70) + '\n\n');
    spinner.fail(`rejected ${name}`);
    return false;
  }
}

export default {
  getCandidates,
  testCandidate,
};
