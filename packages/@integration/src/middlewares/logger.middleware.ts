import { loggerWithOpts$ } from '@marblejs/middleware-logger';
import { createWriteStream } from 'fs';
import { join } from 'path';

const writePath = join(__dirname, '../../', 'access.log');
const stream = createWriteStream(writePath, { flags: 'a' });
const options = { silent: false, stream };

export const logger$ = loggerWithOpts$(options);
