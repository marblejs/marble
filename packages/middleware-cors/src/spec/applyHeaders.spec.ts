import { createHttpResponse } from '@marblejs/http/dist/+internal/testing.util';
import { AccessControlHeader, applyHeaders, ConfiguredHeader } from '../applyHeaders';

describe('applyHeaders', () => {
  test('should handle many methods correctly', done => {
    const configured: ConfiguredHeader[] = [
      { key: AccessControlHeader.Origin, value: '*' },
      { key: AccessControlHeader.Methods, value: 'POST' },
    ];
    const res = createHttpResponse();

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
