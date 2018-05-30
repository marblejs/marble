import { Marbles } from '../../../../util/marbles.spec-util';
import { HttpRequest, QueryParameters, RouteParameters } from '../../http.interface';
import { matchPath } from './matchPath.operator';

const req = (url: string) => ({ url } as HttpRequest);

const reqMatched = (
  url: string,
  matchers: string[] = [],
  params: RouteParameters = {},
  query: QueryParameters = {},
  matchPath = true,
) => ({ url, matchers, params, query, matchPath } as any as HttpRequest);

describe('matchPath operator', () => {
  let operators;

  beforeEach(() => {
    operators = [];
  });

  it('matches simple path', () => {
    operators = [matchPath('/')];
    Marbles.assert(operators, [
      ['-a-b---', { a: req('/'), b: req('/test') }],
      ['-a-----', { a: reqMatched('/') }],
    ]);

    operators = [matchPath('/test')];
    Marbles.assert(operators, [
      ['-a-b---', { a: req('/'), b: req('/test') }],
      ['---b---', { b: reqMatched('/test') }],
    ]);
  });

  it('matches path with url parameter', () => {
    operators = [matchPath('/test/:foo/bar')];
    Marbles.assert(operators, [
      ['-a-b---', { a: req('/test/bar'), b: req('/test/url/bar') }],
      ['---b---', { b: reqMatched('/test/url/bar', [], { foo: 'url' }) }],
    ]);
  });

  it('matches path with query parameter', () => {
    operators = [matchPath('/test')];
    Marbles.assert(operators, [
      ['-a-b-c-', {
        a: req('/test/bar'),
        b: req('/test?foo=bar'),
        c: req('/test/?foo=bar'),
      }],
      ['---b-c-', {
        b: reqMatched('/test?foo=bar', [], {}, { foo: 'bar' } ),
        c: reqMatched('/test/?foo=bar', [], {}, { foo: 'bar' }),
      }]
    ]);
  });

  it('matches path with url and query parameter', () => {
    operators = [matchPath('/test/:foo/bar')];
    Marbles.assert(operators, [
      ['-a-b--', {
        a: req('/test/bar'),
        b: req('/test/url/bar?foo=bar'),
      }],
      ['---b--', {
        b: reqMatched('/test/url/bar?foo=bar', [], { foo: 'url' }, { foo: 'bar' }),
      }]
    ]);
  });

  it('matches path with additional suffix parameter', () => {
    operators = [matchPath('/test', { suffix: '/:foo*' })];
    Marbles.assert(operators, [
      ['-a-b-c-', {
        a: req('/test'),
        b: req('/test/bar'),
        c: req('/test/url/bar'),
      }],
      ['-a-b-c-', {
        a: reqMatched('/test'),
        b: reqMatched('/test/bar'),
        c: reqMatched('/test/url/bar'),
      }]
    ]);
  });

  it('matches path combiner', () => {
    operators = [matchPath('/test', { combiner: true })];
    Marbles.assert(operators, [
      ['-a--', { a: req('/test') }],
      ['-a--', { a: reqMatched('/test', ['/test'], undefined, undefined, false) }],
    ]);

    operators = [matchPath('/test/:id/foo', { combiner: true, suffix: '/:foo*' })];
    Marbles.assert(operators, [
      ['-a--', { a: req('/test/2/foo') }],
      ['-a--', { a: reqMatched('/test/2/foo', ['/test/:id/foo'], { id: '2' }, undefined, false) }],
    ]);
  });
});
