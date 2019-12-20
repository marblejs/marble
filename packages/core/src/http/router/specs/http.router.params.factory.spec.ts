import { factorizeRegExpWithParams } from '../http.router.params.factory';

describe('#factorizeRegExpWithParams', () => {
  test('factorizes path without parameters', () => {
    // given
    const path = '/foo/bar/baz';

    // when
    const { parameters } = factorizeRegExpWithParams(path);

    // then
    expect(parameters).toBeUndefined();
  });

  test('factorizes path with parameters', () => {
    // given
    const path = '/foo/:param1/bar/:param2/baz/';

    // when
    const { regExp, parameters } = factorizeRegExpWithParams(path);
    const match = regExp.exec('/foo/test1/bar/test2/baz');

    // then
    if (!match) return fail('regExp is not matched');

    expect(parameters).toEqual([ 'param1', 'param2' ]);
    expect(match[1]).toEqual('test1');
    expect(match[2]).toEqual('test2');

    return;
  });

  test('factorizes path with connected parameters as a one', () => {
    // given
    const wrongPath = '/foo/:param1:param2/bar';
    const correctPath = '/foo/:param1/:param2/bar';

    // when
    const wrongRegexp = factorizeRegExpWithParams(wrongPath);
    const correctRegexp = factorizeRegExpWithParams(correctPath);

    // then
    expect(wrongRegexp.parameters).toEqual(['param1', 'param2']);
    expect(correctRegexp.parameters).toEqual(['param1', 'param2']);
  });

  test('factorizes path with parameter and wildcard', () => {
    // given
    const path = '/foo/:param1/*/bar';

    // when
    const { parameters, regExp } = factorizeRegExpWithParams(path);

    // then
    expect(parameters).toEqual(['param1']);
    expect(regExp.test('/foo/param/test1/test2/bar')).toEqual(true);
  });

  test('escapes RegExp backslashes and removes duplicates', () => {
    // given
    const path = '/foo/bar//baz';

    // when
    const { regExp } = factorizeRegExpWithParams(path);

    // then
    expect(regExp.test('/foo/bar/baz')).toEqual(true);
  });

  test('translates path parameters to RegExp groups', () => {
    // given
    const path = '/foo/:param1/bar';

    // when
    const { regExp } = factorizeRegExpWithParams(path);

    // then
    expect(regExp.test('/foo/test/bar')).toEqual(true);
  });

  test('matches RegExp wildcard placed inside the path', () => {
    // given
    const path = '/foo/*/bar';

    // when
    const { regExp } = factorizeRegExpWithParams(path);

    // then
    expect(regExp.test('/foo/test/bar')).toEqual(true);
  });

  test('matches RegExpt wildcard at the end of the path', () => {
    // given
    const pathToFactorize = '/foo/*';

    // when
    const { regExp } = factorizeRegExpWithParams(pathToFactorize);

    // then
    expect(regExp.test('/foo/test1/test2')).toEqual(true);
    expect(regExp.test('/foo/test1')).toEqual(true);
    expect(regExp.test('/foo/')).toEqual(true);
    expect(regExp.test('/foo2')).toEqual(false);
  });

  test('matches parameter at the end of the path', () => {
    // given
    const path = '/foo/:param';
    const testUrl = '/foo/test';

    // when
    const { regExp } = factorizeRegExpWithParams(path);
    const match = testUrl.match(regExp);

    // then
    if (match) {
      return expect(match[1]).toEqual('test');
    } else {
      return fail(`${testUrl} -> Regexp should be matched`);
    }
  });

  test('matches wildcard parameter at the end of the path', () => {
    // given
    const pathToFactorize = '/foo/:param*';
    const testUrl1 = '/foo/test1/test2';
    const testUrl2 = '/foo/test1';
    const testUrl3 = '/foo/';

    // when
    const { regExp } = factorizeRegExpWithParams(pathToFactorize);
    const match1 = testUrl1.match(regExp);
    const match2 = testUrl2.match(regExp);
    const match3 = testUrl3.match(regExp);

    // then
    if (match1) {
      expect(match1[1]).toEqual('test1/test2');
    } else {
      return fail(`${testUrl1} -> Regexp should be matched`);
    }

    if (match2) {
      expect(match2[1]).toEqual('test1');
    } else {
      return fail(`${testUrl2} -> Regexp should be matched`);
    }

    if (match3) {
      expect(match3[1]).toEqual(undefined);
    } else {
      return fail(`${testUrl3} -> Regexp should be matched`);
    }

    return;
  });
});
