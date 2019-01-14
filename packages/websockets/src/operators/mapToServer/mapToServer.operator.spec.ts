import { Marbles, createHttpRequest } from '@marblejs/core/dist/+internal';
import { ServerEffect, createInjectionToken, ServerEvent, ServerEventType, matchEvent } from '@marblejs/core';
import { mapToServer, UpgradeEvent } from './mapToServer.operator';

describe('#mapToServer operator', () => {
  let webSocketServerMock;
  let injectorMock;
  let socketMock;
  let bufferMock;

  beforeEach(() => {
    bufferMock = new Buffer('');
    socketMock = { destroy: jest.fn() };
    webSocketServerMock = {
      handleUpgrade: jest.fn((req, socket, head, done) => done()),
      emit: jest.fn(),
    };
    injectorMock = jest.fn(() => webSocketServerMock);
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
    const effect$: ServerEffect = (event$, _, inject) =>
      event$.pipe(
        matchEvent(ServerEvent.upgrade),
        mapToServer(
          { path: '/test_1', server: createInjectionToken() },
          { path: '/test_2', server: createInjectionToken() },
        )(inject),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['--a--', { a: incomingEvent }],
      ['-----', {}],
    ], { meta: injectorMock });

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
    const effect$: ServerEffect = (event$, _, inject) =>
      event$.pipe(
        matchEvent(ServerEvent.upgrade),
        mapToServer(
          { path: '/test_1', server: createInjectionToken() },
          { path: '/test_2', server: createInjectionToken() },
        )(inject),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['--a--', { a: incomingEvent }],
      ['-----', {}],
    ], { meta: injectorMock });

    expect(webSocketServerMock.handleUpgrade).not.toHaveBeenCalled();
    expect(webSocketServerMock.emit).not.toHaveBeenCalled();
    expect(socketMock.destroy).toHaveBeenCalled();
  });
});
