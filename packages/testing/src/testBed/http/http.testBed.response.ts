import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { HttpStatus } from '@marblejs/http';
import { parseJson } from '@marblejs/core/dist/+internal/utils';
import { getContentTypeUnsafe, ContentType } from '@marblejs/http/dist/+internal/contentType.util';
import { HttpTestBedResponseProps, HttpTestBedResponse } from './http.testBed.response.interface';
import { HttpTestBedRequest } from './http.testBed.request.interface';

const parseResponseBody = (props: HttpTestBedResponseProps): string | Array<any> | Record<string, any> | undefined =>
  pipe(
    O.fromNullable(props.body),
    O.map(body => {
      switch (getContentTypeUnsafe(props.headers)) {
        case ContentType.APPLICATION_JSON:
          return pipe(
            body.toString(),
            O.fromPredicate(Boolean),
            O.map(parseJson),
            O.toUndefined);
        case ContentType.TEXT_PLAIN:
        case ContentType.TEXT_HTML:
          return body.toString();
        default:
          return body;
      }
    }),
    O.toUndefined);

export const createResponse = (req: HttpTestBedRequest<any>) => (props: HttpTestBedResponseProps): HttpTestBedResponse =>
  pipe(
    parseResponseBody(props),
    body => ({
      statusCode: props.statusCode ?? HttpStatus.OK,
      statusMessage: props.statusMessage,
      headers: props.headers,
      metadata: {},
      req,
      body,
    }),
  );
