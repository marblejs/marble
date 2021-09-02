import { Event } from '@marblejs/core';
import { bootstrapHttpServer, bootstrapWebSocketClient, bootstrapWebSocketServer } from '@marblejs/websockets/dist/+internal';
import { ReplaySubject, firstValueFrom } from 'rxjs';
import { listener } from './io-ws.integration';

describe('@marblejs/middleware-io - WebSocket integration', () => {
  test('[POST_USER] sends user object', async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);
    const user = { id: 'id', age: 100, };
    const event = { type: 'POST_USER', payload: user };

    // when
    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);

    webSocketClient.once('message', message => eventSubject.next(JSON.parse(message)));
    webSocketClient.send(JSON.stringify(event));

    const result = await firstValueFrom(eventSubject);

    // then
    expect(result).toEqual(event);

    webSocketClient.close();
    webSocketServer.close();
    httpServer.close();
  });

  test('[POST_USER] throws an error if incoming object is invalid', async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);
    const event = {
      type: 'POST_USER',
      payload: { id: 'id', age: '100' },
    };

    const expectedError = {
      type: 'POST_USER_UNHANDLED_ERROR',
      error: {
        name: 'EventError',
        message: 'Validation error',
        data: [{ path: 'age', expected: 'number', got: '"100"' }],
        event: expect.objectContaining(event),
      },
    };

    // when
    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);

    webSocketClient.once('message', message => eventSubject.next(JSON.parse(message)));
    webSocketClient.send(JSON.stringify(event));

    const result = await firstValueFrom(eventSubject);

    // then
    expect(result).toEqual(expectedError);

    webSocketClient.close();
    webSocketServer.close();
    httpServer.close();
  });
});
