import { loggerWithOpts$ } from '@marblejs/middleware-logger';
import { createWriteStream } from 'fs';
import { join } from 'path';

const silent = process.env.NODE_ENV === 'test';
const writePath = join(__dirname, '../../', 'access.log');
const stream = createWriteStream(writePath, { flags: 'a' });
const options = { silent, stream };

export const loggerDev$ = loggerWithOpts$();
export const loggerFile$ = loggerWithOpts$(options);
