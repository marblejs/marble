import { ContentType } from '../util/contentType.util';
import { bodyFactory } from './responseBody.factory';

describe('Response body factory', () => {

  it('#bodyFactory factorizes body for JSON', () => {
    // given
    const headers = { 'Content-Type': ContentType.APPLICATION_JSON };
    const body = { test: 'test' };

    // when
    const factorizedBody = bodyFactory(headers)(body);

    // then
    expect(factorizedBody).toEqual(JSON.stringify(body));
  });

  it(`#bodyFactory doesn't factorize body`, () => {
    // given
    const headers = { 'Content-Type': ContentType.AUDIO };
    const body = '1234';

    // when
    const factorizedBody = bodyFactory(headers)(body);

    // then
    expect(factorizedBody).toEqual('1234');
  });

});
