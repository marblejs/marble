import { validator$, Joi } from '../../src';
import { Effect, httpListener, use, effect } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { map } from 'rxjs/operators';

const getPost$ = effect('/post')('GET')(req$ => req$
  .pipe(
    use(
      validator$({
        query: {
          page: Joi.number()
            .integer()
            .greater(1)
        }
      })
    ),
    map(req => req.query),
    map(query => ({ status: 200, body: { ...query } }))
  );

const getUser$ = effect('/user/:id')('GET')(req$ => req$
  .pipe(
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

const storePost$: Effect = request$ =>
  request$.pipe(
    matchPath('/post'),
    matchType('POST'),
    use(
      validator$({
        query: {
          timestamp: Joi.date().required()
        },
        body: {
          title: Joi.string().required()
        }
      })
    ),
    map(resp => ({ body: { ...resp.body, ...resp.query } }))
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

const api$ = combineRoutes('/api', [getPost$, getUser$, postUser$, storePost$]);

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
