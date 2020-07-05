import fs from 'fs';
import util from 'util';
import child from 'child_process';

export const writeFile = util.promisify(fs.writeFile);
export const appendFile = util.promisify(fs.appendFile);
export const exec = util.promisify(child.exec);

const LOG_FILE = 'where-broke.log';

export const log = {
  clear: () => writeFile(LOG_FILE, ''),
  log: (msg) => appendFile(LOG_FILE, msg),
};
