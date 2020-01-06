import { some } from 'fp-ts/lib/Option';
import { Marbles, createHttpRequest } from '@marblejs/core/dist/+internal';
import { HttpServerEffect, ServerEvent, ServerEventType, matchEvent } from '@marblejs/core';
import { mapToServer, UpgradeEvent } from './websocket.mapToServer.operator';

describe('#mapToServer operator', () => {
  let webSocketServerMock;
  let socketMock;
  let bufferMock;

  beforeEach(() => {
    bufferMock = Buffer.from('');
    socketMock = { destroy: jest.fn() };
    webSocketServerMock = {
      handleUpgrade: jest.fn((req, socket, head, done) => done()),
      emit: jest.fn(),
    };
  });

  test('connects socket to httpServer', () => {
    // given
    const requestMock = createHttpRequest({
      url: '/test_1',
      headers: { upgrade: 'websocket' },
    });
    const incomingEvent: UpgradeEvent = {
      type: ServerEventType.UPGRADE,
      payload: { request: requestMock, socket: socketMock, head: bufferMock },
    };

    // when
    const effect$: HttpServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.upgrade),
        mapToServer(
          { path: '/test_1', server: some(webSocketServerMock) },
          { path: '/test_2', server: some(webSocketServerMock) },
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['--a--', { a: incomingEvent }],
      ['-----', {}],
    ]);

    expect(webSocketServerMock.handleUpgrade).toHaveBeenCalledTimes(1);
    expect(webSocketServerMock.emit).toHaveBeenCalledTimes(1);
    expect(socketMock.destroy).not.toHaveBeenCalled();
  });

  test('destroys socket if path is not found', () => {
    // given
    const requestMock = createHttpRequest({
      url: '/test_other',
      headers: { upgrade: 'websocket' },
    });
    const incomingEvent: UpgradeEvent = {
      type: ServerEventType.UPGRADE,
      payload: { request: requestMock, socket: socketMock, head: bufferMock },
    };

    // when
    const effect$: HttpServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.upgrade),
        mapToServer(
          { path: '/test_1', server: some(webSocketServerMock) },
          { path: '/test_2', server: some(webSocketServerMock) },
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['--a--', { a: incomingEvent }],
      ['-----', {}],
    ]);

    expect(webSocketServerMock.handleUpgrade).not.toHaveBeenCalled();
    expect(webSocketServerMock.emit).not.toHaveBeenCalled();
    expect(socketMock.destroy).toHaveBeenCalled();
  });
});
