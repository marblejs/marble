import { map, mapTo, tap } from 'rxjs/operators';
import * as request from 'supertest';
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

});
