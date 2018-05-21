import { map, mapTo, tap } from 'rxjs/operators';
import * as request from 'supertest';
import { combineRoutes } from './effects/effects.combiner';
import { Effect } from './effects/effects.interface';
import { HttpRequest } from './http.interface';
import { httpListener } from './http.listener';
import { matchPath } from './operators/matchPath.operator';
import { use } from './operators/use.operator';

describe('Http listener', () => {

  it('reacts to attached effect', async () => {
    const effect$: Effect = req$ => req$.pipe(
      matchPath('/test'),
      mapTo({ status: 200 })
    );

    const app = httpListener({ effects: [effect$] });

    return request(app)
      .get('/test')
      .expect(200);
  });

  it('reacts to throwed exception', async () => {
    const effect$: Effect = req$ => req$.pipe(
      matchPath('/test'),
      tap(() => { throw new Error(); }),
      mapTo({ status: 200 })
    );

    const app = httpListener({ effects: [effect$] });

    return request(app)
      .get('/test')
      .expect(500);
  });

  it('integrates with "use" operator', async () => {
    const middleware$: Effect<HttpRequest> = req$ => req$
      .pipe(tap(req => req.test = 'test'));

    const effect$: Effect = req$ => req$.pipe(
      matchPath('/test'),
      use(middleware$),
      map(req => ({ status: 200, body: { test: req.test } })),
    );

    const app = httpListener({ effects: [effect$] });

    return request(app)
      .get('/test')
      .expect(200, { test: 'test' });
  });

  it('integrates with "matchPath" operator', async () => {
    const effect$1: Effect = req$ => req$.pipe(
      matchPath('/test/:id/foo'),
      map(req => req.route.params.id),
      map(id => ({ status: 200, body: { id } })),
    );

    const effect$2: Effect = req$ => req$.pipe(
      matchPath('/test/:id/foo/:id/test'),
      map(req => req.route.params),
      map(params => ({ status: 200, body: { id: params.id } })),
    );

    const effect$3: Effect = req$ => req$.pipe(
      matchPath('/test/:id/bar/:type/test'),
      map(req => req.route.params),
      map(params => ({ status: 200, body: { id: params.id, type: params.type } })),
    );

    const app = httpListener({ effects: [effect$1, effect$2, effect$3] });

    return Promise.all([
      request(app)
        .get('/test/2/foo')
        .expect(200, { id: '2' }),

      request(app)
        .get('/test/2/foo/marble/test')
        .expect(200, { id: 'marble' }),

      request(app)
        .get('/test/2/bar/marble/test')
        .expect(200, { id: '2', type: 'marble' }),
    ]);
  });

  it('integrates with "combineRoutes"', async () => {
    const effect$: Effect = req$ => req$.pipe(
      matchPath('/user/:id'),
      map(req => req.route.params),
      map(params => ({ status: 200, body: { id: params.id, version: params.version } })),
    );

    const api$ = combineRoutes('/api/:version', [ effect$ ]);
    const app = httpListener({ effects: [api$] });

    return request(app)
      .get('/api/v1/user/1')
      .expect(200, { version: 'v1', id: '1' });
  });

});
