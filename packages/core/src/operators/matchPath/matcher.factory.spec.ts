import { matcherFactory, removeQueryParams, removeTrailingSlash } from './matcher.factory';

describe('matcher factory', () => {

  it('#removeQueryParams removes query parameters from url', () => {
    // given
    const input = 'api/v1/foo?testParam';
    const result = 'api/v1/foo';

    // when
    const urlWithoutQuery = removeQueryParams(input);

    // then
    expect(urlWithoutQuery).toEqual(result);
  });

  it('#removeTrailingSlash removes trailing slash from url', () => {
    // given
    const input = 'api/v1/foo/';
    const result = 'api/v1/foo';

    // when
    const urlWithoutTrailingSlash = removeTrailingSlash(input);

    // then
    expect(urlWithoutTrailingSlash).toEqual(result);
  });

  it('#matcherFactory factorizes matcher url based on matching history', () => {
    // given
    const matchingHistory = ['/api/v1', '/user'];
    const pathToMatch = '/foo/';

    // when
    const matcher = matcherFactory(matchingHistory, pathToMatch);

    // then
    expect(matcher).toEqual('/api/v1/user/foo');
  });

  it('#matcherFactory factorizes matcher url based on matching history', () => {
    // given
    const matchingHistory = ['/api/v1', '/user'];
    const pathToMatch = '/foo/';

    // when
    const matcher = matcherFactory(matchingHistory, pathToMatch);

    // then
    expect(matcher).toEqual('/api/v1/user/foo');
  });

  it('#matcherFactory factorizes matcher with additional suffix', () => {
    // given
    const matchingHistory = ['/api/:version', '/user'];
    const pathToMatch = '/foo/';
    const suffix = '/:foo*';

    // when
    const matcher = matcherFactory(matchingHistory, pathToMatch, suffix);

    // then
    expect(matcher).toEqual('/api/:version/user/foo/:foo*');
  });

});
