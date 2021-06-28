import { bootstrapHttpServer, bootstrapWebSocketClient, bootstrapWebSocketServer } from '@marblejs/websockets/dist/+internal';
import { listener } from './io-ws.integration';

describe('@marblejs/middleware-io - WebSocket integration', () => {

  test('[POST_USER] sends user object', async done => {
    // given
    const user = { id: 'id', age: 100, };
    const event = { type: 'POST_USER', payload: user };

    // when
    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);

    webSocketClient.send(JSON.stringify(event));

    // then
    webSocketClient.once('message', message => {
      expect(JSON.parse(message)).toEqual(event);
      webSocketClient.close();
      webSocketServer.close();
      httpServer.close();
      done();
    });
  });

  test('[POST_USER] throws an error if incoming object is invalid', async done => {
    // given
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

    webSocketClient.send(JSON.stringify(event));

    // then
    webSocketClient.once('message', message => {
      expect(JSON.parse(message)).toEqual(expectedError);
      webSocketClient.close();
      webSocketServer.close();
      httpServer.close();
      done();
    });
  });
});
