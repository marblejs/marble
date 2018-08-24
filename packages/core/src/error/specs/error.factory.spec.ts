import { CoreErrorOptions, coreErrorFactory, coreErrorStackTraceFactory } from '../error.factory';

const getMockedStackTrace = (opts: any = {}) => [
  { getMethodName: jest.fn(() => opts.methodName) },
  {
    getFileName: jest.fn(() => opts.filename),
    getLineNumber: jest.fn(() => opts.lineNumber),
    getColumnNumber: jest.fn(() => opts.columnNumber),
  },
] as any as NodeJS.CallSite[];

describe('Error factory', () => {

  describe('#coreErrorStackTraceFactory', () => {
    test('factorizes stack trace', () => {
      // given
      const message = 'test-message';
      const stack = getMockedStackTrace({
        lineNumber: 1,
        columnNumber: 2,
        methodName: 'test-method',
        filename: 'test-filename',
      });
      const options: CoreErrorOptions = {
        contextMethod: 'test-context-method',
        contextPackage: 'test-context-package',
      };

      // when
      const factorizedStackTrace = coreErrorStackTraceFactory(options)(message, stack);

      // then
      expect(factorizedStackTrace.includes('test-context-package')).toEqual(true);
      expect(factorizedStackTrace.includes('test-message')).toEqual(true);
      expect(factorizedStackTrace.includes('test-context-method : test-method'));
      expect(factorizedStackTrace.includes('test-filename')).toEqual(true);
      expect(factorizedStackTrace.includes('[1:2]')).toEqual(true);
    });

    test('factorizes stack trace with undefined attributes', () => {
      // given
      const message = 'test-message';
      const stack = getMockedStackTrace({
        lineNumber: undefined,
        columnNumber: undefined,
        methodName: undefined,
        filename: undefined,
      });
      const options: CoreErrorOptions = {
        contextMethod: 'test-context-method',
      };

      // when
      const factorizedStackTrace = coreErrorStackTraceFactory(options)(message, stack);

      // then
      expect(factorizedStackTrace.includes('@marblejs/core')).toEqual(true);
      expect(factorizedStackTrace.includes('test-message')).toEqual(true);
      expect(factorizedStackTrace.includes('test-context-method : -')).toEqual(true);
      expect(factorizedStackTrace.includes('[0:0]')).toEqual(true);
    });
  });

  describe('#coreErrorFactory', () => {
    beforeEach(() => {
      jest.unmock('../error.factory.ts');
      require('../error.factory.ts').coreErrorStackTraceFactory = jest.fn(() => jest.fn());
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('factorizes CoreError', () => {
      // given
      const message = 'test-message';
      const options = {} as CoreErrorOptions;

      // when
      const factorizedError = coreErrorFactory(message, options);

      // then
      expect(factorizedError).toBeDefined();
      expect(factorizedError.message).toEqual(message);
    });

    test('factorizes CoreError when message is empty', () => {
      // given
      const message = '';
      const options = {} as CoreErrorOptions;

      // when
      const factorizedError = coreErrorFactory(message, options);

      // then
      expect(factorizedError).toBeDefined();
      expect(factorizedError.message).toEqual('Something is not right...');
    });
  });

});
