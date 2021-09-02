import * as http from 'http';
import { Socket } from 'net';
import { forkJoin, lastValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { createContext } from '@marblejs/core';
import {
  isErrorEvent,
  isClientErrorEvent,
  isCloseEvent,
  isConnectEvent,
  isConnectionEvent,
  isListeningEvent,
  isUpgradeEvent,
  isCheckContinueEvent,
  isCheckExpectationEvent,
  ServerEventType,
} from '../../server/http.server.event';
import { closeServer } from '../../+internal/server.util';
import { HttpServerEventStream } from './httpServerEventStream.reader';

describe('#HttpServerEventStream', () => {
  let server: http.Server;

  beforeEach(() => {
    server = http.createServer().listen();
  });

  afterEach(async () => {
    await closeServer(server)();
  });

  test('emits mapped event types', async () => {
    // given
    const socketMock = new Socket();
    const hostname = '127.0.0.1';
    const event$ = HttpServerEventStream({ hostname, server })(createContext());

    // when
    const result = lastValueFrom(forkJoin([
      event$.pipe(filter(isErrorEvent), take(1)),
      event$.pipe(filter(isClientErrorEvent), take(1)),
      event$.pipe(filter(isCloseEvent), take(1)),
      event$.pipe(filter(isConnectEvent), take(1)),
      event$.pipe(filter(isConnectionEvent), take(1)),
      event$.pipe(filter(isListeningEvent), take(1)),
      event$.pipe(filter(isUpgradeEvent), take(1)),
      event$.pipe(filter(isCheckContinueEvent), take(1)),
      event$.pipe(filter(isCheckExpectationEvent), take(1)),
    ]));

    server.emit(ServerEventType.ERROR, new Error('test_error'));
    server.emit(ServerEventType.CLIENT_ERROR);
    server.emit(ServerEventType.CLOSE);
    server.emit(ServerEventType.CONNECT);
    server.emit(ServerEventType.CONNECTION, socketMock);
    server.emit(ServerEventType.LISTENING);
    server.emit(ServerEventType.UPGRADE);
    server.emit(ServerEventType.CHECK_CONTINUE);
    server.emit(ServerEventType.CHECK_EXPECTATION);

    // then
    expect(await result).toHaveLength(9);
    socketMock.destroy();
  });
});
