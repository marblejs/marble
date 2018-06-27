import { throwError } from 'rxjs';
import { mapTo, switchMap } from 'rxjs/operators';
import * as request from 'supertest';
import { HttpError } from './error/error.model';
import { httpListener } from './http.listener';
import { EffectFactory } from './effects/effects.factory';

describe('Http listener', () => {
  it('reacts to attached effect', async () => {
    const effect$ = EffectFactory
      .matchPath('/test')
      .matchType('GET')
      .use(req$ => req$
        .pipe(
          mapTo({ status: 200 })
        )
      );

    const app = httpListener({ effects: [effect$] });

    return request(app)
      .get('/test')
      .expect(200);
  });

  it('reacts to throwed exception', async () => {
    const effect$ = EffectFactory
      .matchPath('/test')
      .matchType('GET')
      .use(req$ => req$
        .pipe(
          switchMap(() => throwError(new HttpError('test', 500))),
          mapTo({ status: 200 })
        )
      );

    const app = httpListener({ effects: [effect$] });

    return request(app)
      .get('/test')
      .expect(500);
  });
});
