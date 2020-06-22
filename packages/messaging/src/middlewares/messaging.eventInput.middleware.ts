import { map } from 'rxjs/operators';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { MsgMiddlewareEffect } from '../effects/messaging.effects.interface';

export const idApplier$: MsgMiddlewareEffect = event$ =>
  event$.pipe(
    map(event => ({
      ...event,
      metadata: {
        ...event.metadata,
        correlationId: event.metadata?.correlationId ?? createUuid(),
      },
    }))
  );
