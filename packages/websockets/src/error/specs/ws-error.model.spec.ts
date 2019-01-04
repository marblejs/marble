import { WebSocketError, WebSocketConnectionError } from '../ws-error.model';
import { WebSocketStatus } from '../../websocket.interface';

test('WebSocketError creates error object', () => {
  // given
  const event = { type: 'TEST_EVENT_TYPE' };
  const errorMessage = 'test_message';
  const errorData = { data: 'test_error_data' };

  // when
  const error = new WebSocketError(event, errorMessage, errorData);

  // then
  expect(error.name).toEqual('WebSocketError');
  expect(error.data).toEqual(errorData);
  expect(error.message).toEqual(errorMessage);
});

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
