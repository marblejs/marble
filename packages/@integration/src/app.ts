import { httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { loggerDev$, loggerFile$ } from './middlewares/logger.middleware';
import { api$ } from './effects/api.effects';

const middlewares = [
  loggerDev$,
  loggerFile$,
  bodyParser$,
];

const effects = [
  api$,
];

export const app = httpListener({ middlewares, effects });
