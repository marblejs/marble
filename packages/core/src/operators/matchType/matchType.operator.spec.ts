import { Marbles } from '../../../../util/marbles.spec-util';
import { HttpRequest } from '../../http.interface';
import { matchType } from './matchType.operator';

const mockReq = (method: string) => ({ method } as HttpRequest);
const mockReqMatched = (method: string) => ({ method, matchType: true } as HttpRequest);

describe('matchType operator', () => {

  it('filters GET request stream', () => {
    const operators = [matchType('GET')];
    Marbles.assert(operators, [
      ['-a-b---', { a: mockReq('GET'), b: mockReq('POST') }],
      ['-a-----', { a: mockReqMatched('GET') }],
    ]);
  });

  it('filters POST request stream', () => {
    const operators = [matchType('POST')];
    Marbles.assert(operators, [
      ['-a-b---', { a: mockReq('GET'), b: mockReq('POST') }],
      ['---b---', { b: mockReqMatched('POST') }],
    ]);
  });

  it('matches all HTTP methods', () => {
    const operators = [matchType('*')];
    Marbles.assert(operators, [
      ['-a-b---', { a: mockReq('GET'), b: mockReq('POST') }],
      ['-a-b---', { a: mockReqMatched('GET'), b: mockReqMatched('POST') }],
    ]);
  });

});
