import { EffectFactory, httpListener, combineRoutes } from '@marblejs/core';
import { ContentType } from '@marblejs/core/dist/+internal/http';
import { map } from 'rxjs/operators';
import { bodyParser$, urlEncodedParser, jsonParser, textParser, rawParser } from '../src';

const effect$ = EffectFactory
  .matchPath('/')
  .matchType('POST')
  .use(req$ => req$.pipe(
    map(req => ({ body: req.body })),
  ));

const defaultParser$ = combineRoutes('/default-parser', {
  middlewares: [bodyParser$()],
  effects: [effect$],
});

const multipleParsers$ = combineRoutes('/multiple-parsers', {
  middlewares: [
    bodyParser$({
      parser: urlEncodedParser,
      type: ['*/x-www-form-urlencoded'],
    }),
    bodyParser$({
      parser: jsonParser,
      type: ['*/json', ContentType.APPLICATION_VND_API_JSON],
    }),
    bodyParser$({
      parser: textParser,
      type: ['text/*'],
    }),
    bodyParser$({
      parser: rawParser,
      type: [ContentType.APPLICATION_OCTET_STREAM],
    }),
  ],
  effects: [effect$],
});

export const listener = httpListener({
  effects: [
    defaultParser$,
    multipleParsers$,
  ],
});
