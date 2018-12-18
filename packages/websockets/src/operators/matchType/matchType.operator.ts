import { isString } from '@marblejs/core/dist/+internal';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { WebSocketEvent } from '../../websocket.interface';

type EventMatcher = string | { type: string };

export const matchType = <I extends WebSocketEvent>
  (...matchers: EventMatcher[]) =>
  (event$: Observable<I>) =>
    event$.pipe(
      filter(event =>
        matchers.some(matcher =>
          event.type === (isString(matcher) ? matcher : matcher.type)
        ),
      ),
    );
