import { tap } from 'rxjs/operators';
import { Effect } from '../../effects/effects.interface';
import { HttpRequest } from '../../http.interface';
import { Marbles } from '../../util/marbles.spec-util';
import { use } from './use.operator';

const createMockReq = (test = 0) => ({ test } as any as HttpRequest);

const middleware$: Effect<HttpRequest> = request$ => request$
  .pipe(tap(req => req.test++));

describe('Use operator', () => {

  it('applies middlewares to the request pipeline', () => {
    const operators = [
      use(middleware$),
      use(middleware$)
    ];

    Marbles.assert(operators, [
      ['-a---', { a: createMockReq() }],
      ['-a---', { a: createMockReq(2) }],
    ]);
  });

});
