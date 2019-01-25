import { HttpEffect } from '../../effects/effects.interface';
import { HttpStatus } from '../../http.interface';
import { createHttpRequest, Marbles } from '../../+internal/testing';
import { switchToProtocol } from './switchToProtocol.operator';

describe('#switchToProtocol operator', () => {
  test(`responds with ${HttpStatus.SWITCHING_PROTOCOLS} status if protocol is supported`, () => {
    // given
    const incomingWebsocketReq = createHttpRequest({
      url: '/',
      headers: {
        upgrade: 'websocket',
        connection: 'upgrade',
      },
    });
    const outgoingWebsocketReq = {
      status: HttpStatus.SWITCHING_PROTOCOLS,
    };
    const incomingHttpReq = createHttpRequest({
      url: '/',
      headers: {
        upgrade: 'http2',
        connection: 'upgrade',
      },
    });
    const outgoingHttpReq = {
      status: HttpStatus.UPGRADE_REQUIRED,
      headers: { 'Upgrade': 'websocket' },
    };

    // when
    const effect$: HttpEffect = req$ =>
      req$.pipe(
        switchToProtocol('websocket'),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-----', { a: incomingWebsocketReq, b: incomingHttpReq }],
      ['-c-d-----', { c: outgoingWebsocketReq, d: outgoingHttpReq }],
    ]);
  });
});
