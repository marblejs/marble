import { map } from 'rxjs/operators';
import { WsErrorEffect } from '../effects/websocket.effects.interface';

export const defaultError$: WsErrorEffect = event$ =>
  event$.pipe(
    map(error => ({
      type: 'UNHANDLED_ERROR',
      error: {
        name: error.name,
        message: error.message,
      },
    })),
  );
