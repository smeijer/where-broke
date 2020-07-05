import { isTTY } from '../util';
import fs from 'fs';
import ora from 'ora';

let ttys = null;

async function beforeAll() {
  ttys = require('ttys');
  ttys.stdin.setRawMode(true);
  ttys.stdin.setEncoding('utf8');
}

async function afterAll() {
  ttys.stdin.destroy();
}

async function getCandidates() {
  if (isTTY) {
    throw new Error(
      'manual mode currently only works when providing candidates via stdin',
    );
  }

  const input = fs.readFileSync(0, 'utf-8');
  return input
    .replace(/\r/g, '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

async function keypress() {
  return new Promise((resolve) =>
    ttys.stdin.once('data', (key) => {
      resolve(key);
    }),
  );
}

async function testCandidate(candidate) {
  process.stdout.write(`Is '${candidate}' a good candidate? [y/n]: `);

  let key = null;
  while (key !== 'y' && key !== 'n') {
    key = await keypress();
  }

  const accepted = key === 'y';

  process.stdout.clearLine();
  process.stdout.cursorTo(0);

  if (accepted) {
    ora().succeed(`accepted ${candidate}`);
  } else {
    ora().fail(`rejected ${candidate}`);
  }

  return accepted;
}

export default {
  getCandidates,
  testCandidate,
  beforeAll,
  afterAll,
};
