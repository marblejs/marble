import { AccessControlHeader, applyHeaders, ConfiguredHeader } from '../applyHeaders';
import { createMockResponse } from './middleware.spec';

describe('applyHeaders', () => {
  test('should handle many methods correctly', done => {
    const configured: ConfiguredHeader[] = [
      { key: AccessControlHeader.Origin, value: '*' },
      { key: AccessControlHeader.Methods, value: 'POST' },
    ];
    const res = createMockResponse();

    applyHeaders(configured, res);

    expect(res.setHeader).toBeCalledTimes(2);
    expect(res.setHeader).toBeCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Methods',
      'POST',
    );
    done();
  });
});
