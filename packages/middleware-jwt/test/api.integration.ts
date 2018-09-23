import { authorize$ as authorizeMiddleware$, generateToken } from '../src';
import { httpListener, EffectFactory, combineRoutes } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { map, flatMap } from 'rxjs/operators';
import { of, iif, throwError } from 'rxjs';

type LoginCredentials = { email: string, password: string };
type Payload = { id: string, email: string};

export const SECRET_KEY = 'SOME_SSH_KEY';

const verifyPayload$ = (payload: { id: string, email: string}) =>
  of(payload).pipe(
    flatMap(payload => iif(
      () => payload.id !== 'test_id' || payload.email !== 'admin@admin.com',
      throwError(new Error()),
      of(payload)
    )),
  );

const authOptions = { secret: SECRET_KEY };
const authorize$ = authorizeMiddleware$(authOptions)(verifyPayload$);
const generateFakeJWTPayload = ({ email }: LoginCredentials): Payload => ({ id: 'test_id', email });

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
  middlewares: [authorize$],
});

const api$ = combineRoutes('/api', [login$, secured$]);

// bootstraping
const middlewares = [bodyParser$];
const effects = [api$];

export const app = httpListener({ middlewares, effects });
