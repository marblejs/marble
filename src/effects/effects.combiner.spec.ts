import { mapTo, tap } from 'rxjs/operators';
import { HttpRequest, HttpResponse } from '../http.interface';
import { Marbles } from '../util/marbles.spec-util';
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

    const group1$: GroupedEffects = { path: '/test', effects: [c$, d$] };
    const group2$: GroupedEffects = { path: '/test/foo', effects: [c$, d$] };

    const req = createMockReq('/test');
    const res = createMockRes();
    const combinedEffects = combineEffects([ a$, b$, group1$, group2$ ]);
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

  it('#combineRoutes factorizes route combiner', () => {
    const a$: Effect = request$ => request$.pipe(mapTo({}));
    const b$: Effect = request$ => request$.pipe(mapTo({}));

    expect(combineRoutes('/test', [a$, b$])).toEqual({
      path: '/test',
      effects: [a$, b$],
    });
  });

});
