import { authorize$, generateToken } from '../src';
import { httpListener, EffectFactory, combineRoutes } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { map, mapTo } from 'rxjs/operators';

type LoginCredentials = { email: string, password: string };

export const SECRET_KEY = 'SOME_SSH_KEY';

const generateFakeJWTPayload = ({ email }: LoginCredentials) => ({ id: 'test_id', email });

const login$ = EffectFactory
  .matchPath('/login')
  .matchType('POST')
  .use(req$ => req$.pipe(
    map(req => req.body as LoginCredentials),
    map(generateFakeJWTPayload),
    map(generateToken({ secret: SECRET_KEY })),
    map(token => ({ body: { token } })),
  ));

const securedRoot$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$.pipe(
    map(req => ({ body: req.user })),
  ));

const secured$ = combineRoutes('/secured', {
  effects: [securedRoot$],
  middlewares: [authorize$({ secret: SECRET_KEY })],
});

const api$ = combineRoutes('/api', [login$, secured$]);

// bootstraping
const middlewares = [bodyParser$];
const effects = [api$];

export const app = httpListener({ middlewares, effects });
