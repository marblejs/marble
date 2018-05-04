import { bodyParser$, httpListener, logger$ } from '../src';
import { hello$, root$ } from './controllers';

const middlewares = [
  logger$,
  bodyParser$,
];

const effects = [
  root$,
  hello$,
];

export const app = httpListener({ middlewares, effects });
