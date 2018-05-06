import { bodyParser$, httpListener, logger$ } from '../src';
import { apiV1$, hello$, root$ } from './controllers';

const middlewares = [
  logger$,
  bodyParser$,
];

const effects = [
  root$,
  hello$,
  apiV1$,
];

export const app = httpListener({ middlewares, effects });
