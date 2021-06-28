import { r, httpListener, combineRoutes } from '@marblejs/http';
import { ContentType, getContentType } from '@marblejs/http/dist/+internal/contentType.util';
import { map } from 'rxjs/operators';
import { bodyParser$, urlEncodedParser, jsonParser, textParser, rawParser } from '../src';

const effect$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    map(req => {
      const incomingContentType = getContentType(req.headers) as ContentType;
      const outgoingContentType = [ContentType.APPLICATION_OCTET_STREAM, ContentType.TEXT_PLAIN].includes(incomingContentType)
        ? incomingContentType
        : ContentType.APPLICATION_JSON;
      return {
        body: req.body,
        headers: { 'Content-Type': outgoingContentType },
      };
    }),
  )));

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
