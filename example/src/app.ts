import { bodyParser$, httpListener, logger$ } from '@marblejs/core';
import { api$ } from './controllers/api.controller';

const middlewares = [logger$, bodyParser$];

const effects = [api$];

export const app = httpListener({ middlewares, effects });
