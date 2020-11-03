import * as qs from 'qs';
import * as contentType from 'content-type';
import { pipe } from 'fp-ts/lib/function';
import { RequestBodyParser } from '../body.model';

export const urlEncodedParser: RequestBodyParser = reqOrContentType => body =>
  pipe(
    contentType.parse(reqOrContentType),
    parsedContentType => body.toString(parsedContentType.parameters.charset),
    stringifiedBody => qs.parse(stringifiedBody),
  );
