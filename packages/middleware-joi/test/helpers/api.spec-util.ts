import { validator$, Joi } from '../../src';
import {
  Effect,
  matchPath,
  matchType,
  httpListener,
  use,
  combineRoutes,
  bodyParser$
} from '@marblejs/core';
import { map } from 'rxjs/operators';

const getUser$: Effect = request$ =>
  request$.pipe(
    matchPath('/user/:id'),
    matchType('GET'),
    use(
      validator$({
        params: {
          id: Joi.number()
            .integer()
            .min(1)
            .max(10)
            .required()
        }
      })
    ),
    map(req => req.params),
    map(params => ({ status: 200, body: { id: params!.id } }))
  );

const postUser$: Effect = request$ =>
  request$.pipe(
    matchPath('/user'),
    matchType('POST'),
    use(
      validator$({
        body: {
          name: Joi.string().required(),
          passport: Joi.string().default('marble.js')
        }
      })
    ),
    map(req => req.body),
    map(response => ({ body: response }))
  );

const api$ = combineRoutes('/api', [getUser$, postUser$]);

const middlewares = [
  bodyParser$,
  validator$(
    {
      headers: {
        token: Joi.string()
          .token()
          .required()
      }
    },
    { stripUnknown: true }
  )
];
const effects = [api$];
export const server = () => httpListener({ middlewares, effects });
