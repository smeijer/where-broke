import ora from 'ora';
import fetch from 'isomorphic-fetch';
import { exec, log } from '../util';

let originalVersion;

async function afterAll() {
  await exec(`yarn add ${originalVersion} --no-lockfile`);
}

async function getCandidates({ module }) {
  console.log(`Fetch version data from registry.npmjs.org`);

  const response = await fetch(`https://registry.npmjs.org/${module}`);
  const data = await response.json();

  return Object.keys(data.versions || {});
}

async function testCandidate(candidate, attempt, { module }) {
  if (!originalVersion) {
    const output = JSON.parse(
      (await exec(`yarn list --pattern ${module} --depth=0 --json`)).stdout
        .replace("'", '')
        .replace('\n', ''),
    );
    originalVersion = output.data.trees[0].name;
  }

  const name = `${module}@${candidate}`;

  const spinner = ora(`install  ${name}`).start();
  await exec(`yarn add ${name} --no-lockfile`);

  try {
    spinner.text = `testing  ${name}`;
    await exec('yarn test');
    spinner.succeed(`accepted ${name}`);
    return true;
  } catch (ex) {
    await log.log(ex.stderr + '\n\n' + '-'.repeat(70) + '\n\n');
    spinner.fail(`rejected ${name}`);
    return false;
  }
}

export default {
  afterAll,
  getCandidates,
  testCandidate,
};
