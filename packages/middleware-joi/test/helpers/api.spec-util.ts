/* eslint-disable deprecation/deprecation */

import { httpListener, use, r, combineRoutes } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { map } from 'rxjs/operators';
import { validator$, Joi } from '../../src';

const getPost$ = r.pipe(
  r.matchPath('/post'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    use(validator$({
      query: Joi.object({ page: Joi.number().integer().greater(1) })
    })),
    map(req => req.query),
    map(query => ({ status: 200, body: { ...query } }))
  )));

const getUser$ = r.pipe(
  r.matchPath('/user/:id'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    use(validator$({
      params: {
        id: Joi.number().integer().min(1).max(10).required(),
      },
    })),
    map(req => req.params),
    map(params => ({ status: 200, body: { id: params.id } }))
  )));

const storePost$ = r.pipe(
  r.matchPath('/post'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(validator$({
      query: Joi.object({ timestamp: Joi.date().required() }),
      body: Joi.object({ title: Joi.string().required() }),
    })),
    map(resp => ({ body: { ...resp.body, ...resp.query } }))
  )));

const postUser$ = r.pipe(
  r.matchPath('/user'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(validator$({
      body: Joi.object({
        name: Joi.string().required(),
        passport: Joi.string().default('marble.js')
      })
    })),
    map(req => req.body),
    map(response => ({ body: response }))
  )));

const api$ = combineRoutes('/api', [getPost$, getUser$, postUser$, storePost$]);

const middlewares = [
  bodyParser$(),
  validator$(
    { headers: { token: Joi.string().token().required() } },
    { stripUnknown: true }
  )
];

const effects = [api$];

export const listener = httpListener({ middlewares, effects });
