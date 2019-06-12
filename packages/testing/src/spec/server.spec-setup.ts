import { map } from 'rxjs/operators';
import { HttpEffectResponse, httpListener, r, use } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { requestValidator$, t } from '@marblejs/middleware-io';

export const createMarble = () => {
  const getEffect$ = r.pipe(
    r.matchPath('/people/:name'),
    r.matchType('GET'),
    r.useEffect(req$ => req$.pipe(
      use(requestValidator$({
        params: t.type({
          name: t.string,
        })
      })),
      map((req): HttpEffectResponse => req.params.name === 'cathy'
        ? ({
          status: 200,
          body: {
            firstName: 'Cathy',
            lastName: 'Scott',
            email: 'cathy.scott98@example.com',
            birthday: '8/6/1978',
            address: '2059 W Craig Rd',
            phone: '(700)-354-2326',
          },
        })
        : ({
          status: 404,
        })
      )
    )),
  );

  const postEffect$ = r.pipe(
    r.matchPath('/notes'),
    r.matchType('POST'),
    r.useEffect(req$ => req$.pipe(
      use(requestValidator$({
        body: t.type({
          date: t.string,
          content: t.string,
          author: t.string,
        })
      })),
      map((req): HttpEffectResponse => ({
        status: 200,
        body: req.body,
      })),
    )),
  );

  return httpListener({
    middlewares: [
      bodyParser$(),
    ],
    effects: [
      getEffect$,
      postEffect$,
    ],
  });
};
