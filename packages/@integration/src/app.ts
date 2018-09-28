import { httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { loggerWithOpts$ } from '@marblejs/middleware-logger';
import { api$ } from './effects/api.effects';

const middlewares = [
  loggerWithOpts$({ silent: false }),
  bodyParser$,
];

const effects = [
  api$,
];

export const app = httpListener({ middlewares, effects });
