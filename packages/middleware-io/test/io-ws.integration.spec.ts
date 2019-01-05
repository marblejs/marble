import * as WebSocket from 'ws';
import * as http from 'http';
import { app } from './io-ws.integration';

describe('@marblejs/middleware-io - WebSocket integration', () => {
  let httpServer: http.Server;
  let webSocketClient: WebSocket;

  const createServer = (cb: () => void) =>
    http.createServer().listen(1337, '127.0.0.1', cb);

  const createWebSocketClient = () =>
    new WebSocket('ws://127.0.0.1:1337');

  beforeEach(done => {
    httpServer = createServer(() => {
      webSocketClient = createWebSocketClient();
      done();
    });
  });

  afterEach(done => {
    webSocketClient.close();
    httpServer.close(done);
  });

  test('[POST_USER] sends user object', done => {
    // given
    const user = { id: 'id', age: 100, };
    const event = JSON.stringify({ type: 'POST_USER', payload: user });

    // when
    app(httpServer);
    webSocketClient.once('open', () => webSocketClient.send(event));

    // then
    webSocketClient.once('message', message => {
      expect(message).toEqual(event);
      done();
    });
  });

  test('[POST_USER] throws an error if incoming object is invalid', done => {
    // given
    const user = { id: 'id', age: '100', };
    const event = JSON.stringify({ type: 'POST_USER', payload: user });
    const expectedError = {
      type: 'POST_USER',
      error: {
        message: 'Validation error',
        data: [{
          // tslint:disable-next-line:max-line-length
          expected: 'model: { payload: { id: string, age: number } } / payload: { id: string, age: number } / age: number',
          got: '"100"',
        }],
      },
    };

    // when
    app(httpServer);
    webSocketClient.once('open', () => webSocketClient.send(event));

    // then
    webSocketClient.once('message', message => {
      const parsedMessage = JSON.parse(message);
      expect(parsedMessage).toEqual(expectedError);
      done();
    });
  });
});
