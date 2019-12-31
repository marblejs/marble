import {  WebSocketConnectionError } from '../websocket.error.model';
import { WebSocketStatus } from '../../websocket.interface';

test('WebSocketConnectionError creates error object', () => {
  // given
  const errorMessage = 'test_message';
  const errorStatus = WebSocketStatus.BAD_GATEWAY;

  // when
  const error = new WebSocketConnectionError(errorMessage, errorStatus);

  // then
  expect(error.name).toEqual('WebSocketConnectionError');
  expect(error.message).toEqual(errorMessage);
  expect(error.status).toEqual(errorStatus);
});
