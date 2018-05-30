import { throwError } from 'rxjs';
import { mapTo, switchMap } from 'rxjs/operators';
import * as request from 'supertest';
import { Effect } from './effects/effects.interface';
import { HttpError } from './error/error.model';
import { httpListener } from './http.listener';
import { matchPath } from './operators';

describe('Http listener', () => {
  it('reacts to attached effect', async () => {
    const effect$: Effect = req$ =>
      req$.pipe(matchPath('/test'), mapTo({ status: 200 }));

    const app = httpListener({ effects: [effect$] });

    return request(app)
      .get('/test')
      .expect(200);
  });

  it('reacts to throwed exception', async () => {
    const effect$: Effect = req$ =>
      req$.pipe(
        matchPath('/test'),
        switchMap(() => throwError(new HttpError('test', 500))),
        mapTo({ status: 200 })
      );

    const app = httpListener({ effects: [effect$] });

    return request(app)
      .get('/test')
      .expect(500);
  });
});
