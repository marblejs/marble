import { HttpRequest } from '../../http.interface';
import { Marbles } from '../../util/marbles.spec-util';
import { matchType } from './matchType.operator';

const createMockReq = (method: string) => ({ method } as HttpRequest);

describe('matchType operator', () => {

  it('filters GET request stream', () => {
    const operators = [matchType('GET')];
    Marbles.assert(operators, [
      ['-a-b---', { a: createMockReq('GET'), b: createMockReq('POST') }],
      ['-a-----', { a: createMockReq('GET') }],
    ]);
  });

  it('filters POST request stream', () => {
    const operators = [matchType('POST')];
    Marbles.assert(operators, [
      ['-a-b---', { a: createMockReq('GET'), b: createMockReq('POST') }],
      ['---b---', { b: createMockReq('POST') }],
    ]);
  });

});
