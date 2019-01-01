import { EventEmitter } from 'events';
import { MarbleWebSocketClient, WebSocketStatus, WebSocketServer } from '../../websocket.interface';
import { WebSocketConnectionError } from '../../error/ws-error.model';
import {
  handleClientValidationError,
  handleClientBrokenConnection,
  handleServerBrokenConnections,
} from '../websocket.helper';

class WebSocketClientMock extends EventEmitter {
  isAlive: boolean | undefined;
  ping = jest.fn();
  close = jest.fn();
  terminate = jest.fn();
}

describe('#handleServerBrokenConnections', () => {
  test('heartbeats', () => {
    // given
    const server = { clients: [new WebSocketClientMock()] };

    // when
    jest.spyOn(global, 'setInterval').mockImplementation(jest.fn(cb => cb()));
    server.clients.forEach(client => client.isAlive = true);
    handleServerBrokenConnections(server as any as WebSocketServer);

    // then
    server.clients.forEach(client => {
      expect(client.isAlive).toEqual(false);
      expect(client.ping).toHaveBeenCalled();
    });
  });

  test('terminates dead connections', () => {
    // given
    const server = { clients: [
      new WebSocketClientMock(),
      new WebSocketClientMock(),
    ] };

    // when
    jest.spyOn(global, 'setInterval').mockImplementation(jest.fn(cb => cb()));
    server.clients[0].isAlive = true;
    server.clients[1].isAlive = false;
    handleServerBrokenConnections(server as any as WebSocketServer);

    // then
    expect(server.clients[0].terminate).not.toHaveBeenCalled();
    expect(server.clients[1].terminate).toHaveBeenCalled();
  });
});

describe('#handleClientBrokenConnection', () => {
  test('heartbeats', () => {
    // given
    const client = new WebSocketClientMock() as any as MarbleWebSocketClient;

    // when
    client.isAlive = false;
    jest.spyOn(global, 'clearTimeout');
    handleClientBrokenConnection(client);

    // then
    client.emit('open');
    expect(client.isAlive).toEqual(true);
    client.isAlive = false;

    client.emit('ping');
    expect(client.isAlive).toEqual(true);
    client.isAlive = false;

    client.emit('pong');
    expect(client.isAlive).toEqual(true);
    client.isAlive = false;

    client.emit('close');
    expect(client.isAlive).toEqual(false);

    expect(global.clearTimeout).toHaveBeenCalledTimes(4);
  });

  test('terminates if heartbeat is timed out', () => {
    // given
    const client = new WebSocketClientMock() as any as MarbleWebSocketClient;

    // when
    jest.spyOn(global, 'setTimeout').mockImplementation(jest.fn(cb => cb()));
    handleClientBrokenConnection(client);

    // then
    client.emit('ping');
    expect(client.terminate).toHaveBeenCalled();
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
