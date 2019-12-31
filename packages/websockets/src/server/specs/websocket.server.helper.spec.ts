import { EventEmitter } from 'events';
import { TimeoutError } from 'rxjs';
import { Marbles } from '@marblejs/core/dist/+internal';
import { MarbleWebSocketClient, WebSocketStatus, WebSocketServer } from '../../websocket.interface';
import { WebSocketConnectionError } from '../../error/websocket.error.model';
import {
  handleClientValidationError,
  handleClientBrokenConnection,
  handleServerBrokenConnections,
  HEART_BEAT_INTERVAL,
  HEART_BEAT_TERMINATE_INTERVAL,
  ClientStatus,
} from '../websocket.server.helper';

class WebSocketClientMock extends EventEmitter {
  isAlive = false;
  ping = jest.fn();
  close = jest.fn();
  terminate = jest.fn();
}

class WebSocketServerMock extends EventEmitter {
  constructor(public clients: WebSocketClientMock[]) {
    super();
  }
}

describe('#handleServerBrokenConnections', () => {
  test('terminates dead connections', () => {
    // given
    const scheduler = Marbles.createTestScheduler();
    const server = new WebSocketServerMock([
      new WebSocketClientMock(),
      new WebSocketClientMock(),
    ]);

    // when
    const brokenConnection$ = handleServerBrokenConnections(server as any as WebSocketServer, scheduler);

    scheduler.schedule(() => {
      server.clients[0].isAlive = true;
      server.clients[1].isAlive = true;
      server.emit('connection');
    }, 0);

    scheduler.schedule(() => {
      server.clients[0].isAlive = true;
      server.clients[1].isAlive = false; // dead client
    }, HEART_BEAT_INTERVAL + 100);

    scheduler.schedule(
      () => server.emit('close'),
      HEART_BEAT_INTERVAL * 2 + 100
    );

    // then
    scheduler.run(({ expectObservable, flush }) => {
      expectObservable(brokenConnection$).toBe(
        `${HEART_BEAT_INTERVAL}ms (ab) ${HEART_BEAT_INTERVAL - 4}ms (cd) 96ms |`,
        {
          a: ClientStatus.ALIVE, b: ClientStatus.ALIVE,
          c: ClientStatus.ALIVE, d: ClientStatus.DEAD,
        },
      );
      flush();
      expect(server.clients[0].terminate).not.toHaveBeenCalled();
      expect(server.clients[1].terminate).toHaveBeenCalled();
    });
  });
});

describe('#handleClientBrokenConnection', () => {
  test('heartbeats and closes stream', () => {
    // given
    const scheduler = Marbles.createTestScheduler();
    const client = new WebSocketClientMock() as any as MarbleWebSocketClient;
    const isAlive = true;

    // when
    const brokenConnection$ = handleClientBrokenConnection(client, scheduler);
    scheduler.schedule(() => client.emit('open'),    100);
    scheduler.schedule(() => client.isAlive = false, 150);
    scheduler.schedule(() => client.emit('ping'),    200);
    scheduler.schedule(() => client.isAlive = false, 250);
    scheduler.schedule(() => client.emit('pong'),    300);
    scheduler.schedule(() => client.emit('close'),   400);

    // then
    scheduler.run(({ expectObservable, flush }) => {
      expectObservable(brokenConnection$).toBe(
        '100ms a 99ms b 99ms c 99ms |',
        { a: isAlive, b: isAlive, c: isAlive },
      );
      flush();
      expect(client.terminate).not.toHaveBeenCalled();
    });
  });

  test('terminates if heartbeat is timed out', () => {
    // given
    const scheduler = Marbles.createTestScheduler();
    const client = new WebSocketClientMock() as any as MarbleWebSocketClient;
    const timeoutError = new TimeoutError();
    const isAlive = true;

    // when
    const brokenConnection$ = handleClientBrokenConnection(client, scheduler);
    scheduler.schedule(() => client.emit('open'), 100);

    // then
    scheduler.run(({ expectObservable, flush }) => {
      expectObservable(brokenConnection$).toBe(
        `100ms a ${HEART_BEAT_TERMINATE_INTERVAL - 1}ms #`,
        { a: isAlive },
        timeoutError,
      );
      flush();
      expect(client.terminate).toHaveBeenCalled();
    });
  });
});

describe('#handleClientValidationError', () => {
  test('closes connection with defined closing code', () => {
    // given
    const error = new WebSocketConnectionError('test', WebSocketStatus.NORMAL_CLOSURE);
    const client = new WebSocketClientMock() as any as MarbleWebSocketClient;

    // when
    client.isAlive = true;
    handleClientValidationError(client)(error);

    // then
    expect(client.isAlive).toEqual(false);
    expect(client.close).toHaveBeenCalledWith(error.status, error.message);
  });

  test('closes connection with defined closing code', () => {
    // given
    const error = new Error('test') as WebSocketConnectionError;
    const client = new WebSocketClientMock() as any as MarbleWebSocketClient;

    // when
    client.isAlive = true;
    handleClientValidationError(client)(error);

    // then
    expect(client.isAlive).toEqual(false);
    expect(client.close).toHaveBeenCalledWith(WebSocketStatus.INTERNAL_ERROR, error.message);
  });
});
