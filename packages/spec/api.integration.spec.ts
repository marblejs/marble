import * as path from 'path';
import { of, throwError } from 'rxjs';
import { filter, map, mapTo, switchMap } from 'rxjs/operators';
import * as request from 'supertest';
import { HttpStatus } from '../core/dist/http.interface';
import { ContentType } from '../core/dist/util/contentType.util';
import { EffectFactory, Effect, HttpError, HttpRequest, combineRoutes, httpListener, use } from '../core/src';
import { bodyParser$ } from '../middleware-body/src';
import { readFile } from '../util/fileReader.helper';

const MOCKED_USER_LIST = [{ id: 1 }, { id: 2 }];
const STATIC_PATH = path.resolve(__dirname, '../../docs/assets');

const authorize$: Effect<HttpRequest> = request$ =>
  request$.pipe(
    filter(req => req.headers.authorization === 'Bearer test'),
  );

const root$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$
    .pipe(
      mapTo({ status: 200, body: 'root' }),
    ));

const getUserList$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$
    .pipe(
      switchMap(() => of(MOCKED_USER_LIST)),
      map(users => ({ body: users }))
    ));

const getUserSingle$ = EffectFactory
  .matchPath('/:id')
  .matchType('GET')
  .use(req$ => req$
    .pipe(
      map(({ params, query }) => ({ body: { params, query } }))
    ));

const postUser$ = EffectFactory
  .matchPath('/')
  .matchType('POST')
  .use(req$ => req$
    .pipe(
      use(authorize$),
      map(req => req.body),
      map(response => ({ body: response }))
    ));

const error$ = EffectFactory
  .matchPath('/error')
  .matchType('GET')
  .use(req$ => req$
    .pipe(
      switchMap(() => throwError(new HttpError('test', HttpStatus.METHOD_NOT_ALLOWED, { test: 'test' }))),
    )
  );

const file$ = EffectFactory
  .matchPath('/static/:dir')
  .matchType('GET')
  .use(req$ => req$
    .pipe(
      map(req => req.params!.dir as string),
      switchMap(readFile(STATIC_PATH)),
      map(body => ({ body }))
    ));

const user$ = combineRoutes('/user', [getUserList$, getUserSingle$, postUser$]);

const api$ = combineRoutes('/api/v1', [root$, file$, error$, user$]);

const app = httpListener({
  middlewares: [bodyParser$],
  effects: [api$]
});

describe('API integration', () => {
  it('returns 404 when route not found: /', async () =>
    request(app)
      .post('/')
      .expect(404));

  it('returns status 200: /api/v1', async () =>
    request(app)
      .get('/api/v1')
      .expect(200, '"root"'));

  it('returns error response: /api/v1/error', async () =>
    request(app)
      .get('/api/v1/error')
      .expect(HttpStatus.METHOD_NOT_ALLOWED, { error: {
        status: HttpStatus.METHOD_NOT_ALLOWED,
        data: { test: 'test' },
        message: 'test',
      }}));

  it('returns object: /api/v1/user', async () =>
    request(app)
      .get('/api/v1/user')
      .expect(200, MOCKED_USER_LIST));

  it('intercepts "query" and "params" from url: /api/v1/user/:id?filter=all', async () =>
    request(app)
      .get('/api/v1/user/123?filter=all')
      .expect(200, {
        params: { id: 123, version: 'v1' },
        query: { filter: 'all' },
      }));

  it('parses body and returns echo for secured route: /api/v1/user', async () =>
    request(app)
      .post('/api/v1/user')
      .set('Authorization', 'Bearer test')
      .send({ test: 'test' })
      .expect(200, { test: 'test' }));

  it(`returns static file as ${ContentType.TEXT_HTML}: /api/v1/static/index.html`, async () =>
    request(app)
      .get('/api/v1/static/index.html')
      .expect('Content-Type', ContentType.TEXT_HTML)
      .then(res => expect(res.text).toContain('<h1>Test</h1>')));

});
