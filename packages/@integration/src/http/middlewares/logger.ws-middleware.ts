import { WsMiddlewareEffect } from '@marblejs/websockets';
import { tap } from 'rxjs/operators';

export const logger$: WsMiddlewareEffect = event$ =>
  event$.pipe(
    tap(e => console.log(`type: ${e.type}, payload: ${e.payload}`)),
  );
