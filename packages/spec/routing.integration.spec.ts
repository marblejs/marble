import { delay, map, tap } from 'rxjs/operators';
import * as request from 'supertest';
import { Effect, httpListener, matchPath, matchType } from '../core/src';

describe('Routing integration', async () => {

  test('flow goes through Effects in array order', () => {
    // given
    const p1$: Effect = req$ => req$.pipe(
      tap(req => req.test = req.test || []),
      tap(req => req.test.push(1)),
      matchPath('/p1'), matchType('GET'), map(req => ({ body: req.test }))
    );

    const p2$: Effect = req$ => req$.pipe(
      tap(req => req.test = req.test || []),
      tap(req => req.test.push(2)),
      delay(100),
      matchPath('/p2'), matchType('GET'), map(req => ({ body: req.test }))
    );

    const p3$: Effect = req$ => req$.pipe(
      tap(req => req.test = req.test || []),
      tap(req => req.test.push(3)),
      matchPath('/p3'), matchType('GET'), map(req => ({ body: req.test }))
    );

    const app = httpListener({ effects: [p1$, p2$, p3$ ] });

    // when
    return Promise.all([
      request(app).get('/p1').expect(200, [1]),
      request(app).get('/p2').expect(200, [1, 2]),
      request(app).get('/p3').expect(200, [1, 2, 3]),
    ]);
  });

  test('when all paths are the same - resolves only one Effect', () => {
    // given
    const p1$: Effect = req$ => req$.pipe(
      tap(req => req.test = req.test || []),
      tap(req => req.test.push(1)),
      delay(100),
      matchPath('/p1'), matchType('GET'), map(req => ({ body: req.test }))
    );

    const p2$: Effect = req$ => req$.pipe(
      tap(req => req.test = req.test || []),
      tap(req => req.test.push(2)),
      matchPath('/p1'), matchType('GET'), map(req => ({ body: req.test }))
    );

    const p3$: Effect = req$ => req$.pipe(
      tap(req => req.test = req.test || []),
      tap(req => req.test.push(3)),
      matchPath('/p1'), matchType('GET'), map(req => ({ body: req.test }))
    );

    const app = httpListener({ effects: [p1$, p2$, p3$ ] });

    // when
    return request(app).get('/p1').expect(200, [1]);
  });

  test('when paths with params are matched - resolves Effects in array order', () => {
    // given
    const p1$: Effect = req$ => req$.pipe(
      tap(req => req.test = req.test || []),
      tap(req => req.test.push(1)),
      matchPath('/p1'), matchType('GET'), map(req => ({ body: req.test }))
    );

    const p2$: Effect = req$ => req$.pipe(
      tap(req => req.test = req.test || []),
      tap(req => req.test.push(2)),
      matchPath('/:name'), matchType('GET'), map(req => ({ body: req.test }))
    );

    // then
    const app1 = httpListener({ effects: [p1$, p2$ ] });
    const app2 = httpListener({ effects: [p2$, p1$ ] });

    // when
    return Promise.all([
      // 1 - /p1  2 - /:name
      request(app1).get('/p1').expect(200, [1]),
      request(app1).get('/test').expect(200, [1, 2]),
      // 1 - /:name  2 - /p1
      request(app2).get('/test').expect(200, [2]),
      request(app2).get('/p1').expect(200, [2]),
    ]);
  });

});
