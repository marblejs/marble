import * as WebSocket from 'ws';

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

export enum WebSocketConnectionLiveness {
  ALIVE,
  DEAD,
}

export type WebSocketData = string | Buffer | ArrayBuffer | Buffer[];

export const WebsocketReadyStateMap = {
  [WebSocket.OPEN]: 'open',
  [WebSocket.CLOSED]: 'closed',
  [WebSocket.CLOSING]: 'closing',
  [WebSocket.CONNECTING]: 'connecting',
};
