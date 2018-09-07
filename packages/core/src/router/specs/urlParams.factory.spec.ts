import { factorizeRegExpWithParams } from '../urlParams.factory';

describe('Url parameters factory', () => {

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
      const match = '/foo/test1/bar/test2/baz'.match(regExp);

      // then
      expect(parameters).toEqual([ 'param1', 'param2' ]);
      expect(match![1]).toEqual('test1');
      expect(match![2]).toEqual('test2');
    });

    test('factorizes path with connected parameters as a one', () => {
      // given
      const wrongPath = '/foo/:param1:param2/bar';
      const correctPath = '/foo/:param1/:param2/bar';

      // when
      const wrongRegexp = factorizeRegExpWithParams(wrongPath);
      const correctRegexp = factorizeRegExpWithParams(correctPath);

      // then
      expect(wrongRegexp.parameters).toEqual(['param1:param2']);
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
      expect(regExp).toEqual(/^\/foo\/bar\/baz$/);
      expect(regExp.test('/foo/bar/baz')).toEqual(true);
    });

    test('translates path parameters to RegExp groups', () => {
      // given
      const path = '/foo/:param1/bar';

      // when
      const { regExp } = factorizeRegExpWithParams(path);

      // then
      expect(regExp).toEqual(/^\/foo\/([^\/]+)\/bar$/);
      expect(regExp.test('/foo/test/bar')).toEqual(true);
    });

    test('matches RegExp wildcard placed inside the path', () => {
      // given
      const path = '/foo/*/bar';

      // when
      const { regExp } = factorizeRegExpWithParams(path);

      // then
      expect(regExp).toEqual(/^\/foo\/.*?\/bar$/);
      expect(regExp.test('/foo/test/bar')).toEqual(true);
    });

    test('matched RegExpt wildcard at the end of the path', () => {
      // given
      const path = '/foo/*';

      // when
      const { regExp } = factorizeRegExpWithParams(path);

      // then
      expect(regExp).toEqual(/^\/foo\/.*?$/);
      expect(regExp.test('/foo/test1/test2')).toEqual(true);
      expect(regExp.test('/foo/test1')).toEqual(true);
      expect(regExp.test('/foo/')).toEqual(true);
    });
  });

});
