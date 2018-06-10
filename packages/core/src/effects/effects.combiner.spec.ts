import { map, mapTo, tap } from 'rxjs/operators';
import { Marbles } from '../../../util/marbles.spec-util';
import { HttpRequest, HttpResponse } from '../http.interface';
import { combineEffects, combineMiddlewareEffects, combineRoutes } from './effects.combiner';
import { Effect, GroupedEffects } from './effects.interface';

const createMockRes = () => ({} as HttpResponse);
const createMockReq = (url = '/') => ({ url } as HttpRequest);

describe('Effects combiner', () => {

  it('#combineEffects combines effects', () => {
    const e1: Effect = request$ => request$.pipe(mapTo({ status: 200 }));
    const e2: Effect = request$ => request$.pipe(mapTo({ status: 400 }));

    const req = createMockReq('/');
    const res = createMockRes();

    const combinedEffects = combineEffects([ e1, e2 ]);
    const http$ = combinedEffects(res)(req);

    Marbles.assertCombinedEffects(http$, [
      '(ab|)', {
        a: { status: 200 },
        b: { status: 400 },
      }
    ]);
  });

  it('#combineEffects combines effects for matched paths', () => {
    const a$: Effect = request$ => request$.pipe(mapTo({ status: 201 }));
    const b$: Effect = request$ => request$.pipe(mapTo({ status: 202 }));

    const req = createMockReq('/');
    const res = createMockRes();
    const combinedEffects = combineEffects([ a$, b$ ]);
    const http$ = combinedEffects(res)(req);

    Marbles.assertCombinedEffects(http$, [
      '(ab|)', {
        a: { status: 201 },
        b: { status: 202 },
      }
    ]);
  });

  it('#combineEffects combines effects for grouped effects', () => {
    const a$: Effect = request$ => request$.pipe(mapTo({ status: 201 }));
    const b$: Effect = request$ => request$.pipe(mapTo({ status: 202 }));
    const c$: Effect = request$ => request$.pipe(mapTo({ status: 203 }));
    const d$: Effect = request$ => request$.pipe(mapTo({ status: 204 }));

    const group1$: GroupedEffects = { path: '/test', effects: [c$, d$], middlewares: [] };

    const req = createMockReq('/test');
    const res = createMockRes();
    const combinedEffects = combineEffects([ a$, b$, group1$ ]);
    const http$ = combinedEffects(res)(req);

    Marbles.assertCombinedEffects(http$, [
      '(abcd|)', {
        a: { status: 201 },
        b: { status: 202 },
        c: { status: 203 },
        d: { status: 204 },
      }
    ]);
  });

  it('#combineEffects combines effects for grouped effects with middlewares', () => {
    // given
    const a$: Effect = request$ => request$.pipe(map(req => ({ status: 201, mid: req.mid })));
    const b$: Effect = request$ => request$.pipe(map(req => ({ status: 202, mid: req.mid })));
    const c$: Effect = request$ => request$.pipe(map(req => ({ status: 203, mid: req.mid })));
    const d$: Effect = request$ => request$.pipe(map(req => ({ status: 204, mid: req.mid })));

    const m$: Effect<HttpRequest> = request$ => request$.pipe(tap(req => req.mid = (req.mid || 0) + 1));

    const group1$: GroupedEffects = { path: '/test', effects: [c$, d$], middlewares: [m$, m$] };

    // when
    const req = createMockReq('/test/foo');
    const res = createMockRes();
    const combinedEffects = combineEffects([ a$, b$, group1$, c$, d$ ]);
    const http$ = combinedEffects(res)(req);

    // then
    Marbles.assertCombinedEffects(http$, [
      '(abcdef|)', {
        a: { status: 201, mid: undefined },
        b: { status: 202, mid: undefined },
        c: { status: 203, mid: 2 },
        d: { status: 204, mid: 2 },
        e: { status: 203, mid: 2 },
        f: { status: 204, mid: 2 },
      }
    ]);
  });

  it('#combineMiddlewareEffects combines chained middlewares', () => {
    const a$: Effect<HttpRequest> = request$ => request$.pipe(tap(req => { req.test = 1; }));
    const b$: Effect<HttpRequest> = request$ => request$.pipe(tap(req => { req.test = req.test + 1; }));
    const c$: Effect<HttpRequest> = request$ => request$.pipe(tap(req => { req.test = req.test + 1; }));

    const req = createMockReq();
    const res = createMockRes();
    const combinedEffects = combineMiddlewareEffects([ a$, b$, c$ ]);
    const http$ = combinedEffects(res)(req);

    Marbles.assertCombinedEffects(http$, [
      '(a|)', {
        a: { url: '/', test: 3 }
      }
    ]);
  });

  it('#combineRoutes factorizes combined routes for effects only', () => {
    // given
    const a$: Effect = request$ => request$.pipe(mapTo({}));
    const b$: Effect = request$ => request$.pipe(mapTo({}));

    // when
    const combiner = combineRoutes('/test', [a$, b$]);

    // then
    expect(combiner).toEqual({
      path: '/test',
      effects: [a$, b$],
      middlewares: [],
    });
  });

  it('#combineRoutes factorizes combined routes for effects and middlewares', () => {
    // given
    const a$: Effect = request$ => request$.pipe(mapTo({}));
    const b$: Effect = request$ => request$.pipe(mapTo({}));

    const m1$: Effect<HttpRequest> = request$ => request$;
    const m2$: Effect<HttpRequest> = request$ => request$;

    // when
    const combiner = combineRoutes('/test', {
      effects: [a$, b$],
      middlewares: [m1$, m2$],
    });

    // then
    expect(combiner).toEqual({
      path: '/test',
      effects: [a$, b$],
      middlewares: [m1$, m2$],
    });
  });

  it('#combineRoutes factorizes combined routes for effects and empty middlewares', () => {
    // given
    const a$: Effect = request$ => request$.pipe(mapTo({}));
    const b$: Effect = request$ => request$.pipe(mapTo({}));

    // when
    const combiner = combineRoutes('/test', {
      effects: [a$, b$],
    });

    // then
    expect(combiner).toEqual({
      path: '/test',
      effects: [a$, b$],
      middlewares: [],
    });
  });

});
