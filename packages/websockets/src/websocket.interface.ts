import * as WebSocket from 'ws';
import { Observable } from 'rxjs';


export type WebSocketServer = WebSocket.Server;

export type WebSocketClient = WebSocket;

export type WebSocketData = WebSocket.Data;

export interface MarbleWebSocketServer extends WebSocketServer {
  sendBroadcastResponse: <T>(response: T) => Observable<never>;
}

export interface MarbleWebSocketClient extends WebSocketClient {
  isAlive: boolean;
  sendResponse: <T>(response: T) => Observable<never>;
  sendBroadcastResponse: <T>(response: T) => Observable<never>;
}

export enum WebSocketStatus {
  NORMAL_CLOSURE = 1000,
  GOING_AWAY = 1001,
  PROTOCOL_ERROR = 1002,
  UNSUPPORTED_DATA = 1003,
  NO_STATUS_RECIEVED = 1005,
  ABNORMAL_CLOSURE = 1006,
  INVALID_FRAME_PAYLOAD_DATA = 1007,
  POLICY_VALIDATION = 1008,
  MESSAGE_TOO_BIG = 1009,
  MISSING_EXTENSION = 1010,
  INTERNAL_ERROR = 1011,
  SERVICE_RESTART = 1012,
  TRY_AGAIN_LATER = 1013,
  BAD_GATEWAY = 1014,
  TLS_HANDSHAKE = 1015,
}
