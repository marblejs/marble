import * as http from 'http';
import { Observable, merge } from 'rxjs';
import { RequestEffect } from './effects.interface';
import { HttpRequest } from '../http.interface';

export const combineEffects = (...effects: RequestEffect[]) => (request$: Observable<HttpRequest>) =>
  merge(
    ...effects.map(effect => {
      const output$ = effect(request$);

      if (!output$) {
        throw new TypeError(`combineEffects: one of the provided Effects does not return a stream!`);
      }

      return output$;
    })
  );
