import { ContentType } from '../../+internal/contentType.util';
import { factorizeBody } from '../http.responseBody.factory';

describe('#bodyFactory', () => {
  test('factorizes body for urlencoded', () => {
    // given
    const headers = { 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED };
    const body = { test: 'test' };

    // when
    const factorizedBody = factorizeBody({ headers, body });

    // then
    expect(factorizedBody).toEqual('test=test');
  });

  test('factorizes body for JSON', () => {
    // given
    const headers = { 'Content-Type': ContentType.APPLICATION_JSON };
    const body = { test: 'test' };

    // when
    const factorizedBody = factorizeBody({ headers, body });

    // then
    expect(factorizedBody).toEqual(JSON.stringify(body));
  });

  test('factorizes body for plain text', () => {
    // given
    const headers = { 'Content-Type': ContentType.TEXT_PLAIN };
    const bodies = [33, 'test', false];

    // when
    const factorizedBodies = bodies.map(body => factorizeBody({ headers, body }));

    // then
    expect(factorizedBodies).toEqual(bodies.map(String));
  });

  test('doesn\'t factorize body for urlencoded if body is stringified', () => {
    // given
    const headers = { 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED };
    const body = 'test=test';

    // when
    const factorizedBody = factorizeBody({ body, headers });

    // then
    expect(factorizedBody).toEqual('test=test');
  });

  test(`doesn't factorize body if "Content-Type" is unknown`, () => {
    // given
    const headers = { 'Content-Type': ContentType.AUDIO };
    const body = '1234';

    // when
    const factorizedBody = factorizeBody({ headers, body });

    // then
    expect(factorizedBody).toEqual('1234');
  });
});
