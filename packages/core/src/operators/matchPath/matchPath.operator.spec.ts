import { HttpRequest, RouteParameters, QueryParameters } from '../../http.interface';
import { Marbles } from '../../util/marbles.spec-util';
import { matchPath } from './matchPath.operator';
import { queryParamsFactory } from "../../operators/queryParamsFactory/queryParams.factory";
import { urlParamsFactory } from './urlParams.factory';

const req = (url: string) => ({ url } as HttpRequest);
const reqMatched = (url: string, queryString = '', matchers: string[] = [], params: RouteParameters = {}, query?: QueryParameters) => {
  const urlWithQuery = !!queryString ? `${url}?${queryString}` : url;
  return {
    url: urlWithQuery,
    matchers,
    params,
    query: queryParamsFactory(urlWithQuery),
  } as HttpRequest;
};

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
      ['---b---', { b: reqMatched('/test/url/bar', null, [], { foo: 'url' }) }],
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
        b: reqMatched('/test', 'foo=bar'),
        c: reqMatched('/test/', 'foo=bar'),
      }],
    ]);
  });

  it('matches path with url and query parameter', () => {
    operators = [matchPath('/test/:foo/bar')];
    Marbles.assert(operators, [
      ['-a-b--', {
        a: req('/test/bar'),
        b: req('/test/url/bar?foo=bar') }],
      ['---b--', {
        b: reqMatched('/test/url/bar', 'foo=bar', [], { foo: 'url' }) }],
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
      }],
    ]);
  });

  it('matches path combiner', () => {
    operators = [matchPath('/test', { combiner: true })];
    Marbles.assert(operators, [
      ['-a--', { a: req('/test') }],
      ['-a--', { a: reqMatched('/test', null, ['/test']) }],
    ]);

    operators = [matchPath('/test/:id/foo', { combiner: true, suffix: '/:foo*' })];
    Marbles.assert(operators, [
      ['-a--', { a: req('/test/2/foo') }],
      ['-a--', { a: reqMatched('/test/2/foo', null, ['/test/:id/foo'], { id: '2' }) }],
    ]);
  });

});
