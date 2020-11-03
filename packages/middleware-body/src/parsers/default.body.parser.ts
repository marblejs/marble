import * as typeis from 'type-is';
import { getContentType } from '@marblejs/core/dist/+internal/http';
import { RequestBodyParser } from '../body.model';
import { jsonParser } from './json.body.parser';
import { textParser } from './text.body.parser';
import { rawParser } from './raw.body.parser';
import { urlEncodedParser } from './url.body.parser';

const SUPPORTED_CONTENT_TYPES = ['json', 'urlencoded', 'application/octet-stream', 'text', 'html'];

export const defaultParser: RequestBodyParser = reqOrContentType => body => {
  const contentType = typeof reqOrContentType === 'string'
    ? reqOrContentType
    : getContentType(reqOrContentType.headers);

  switch (typeis.is(contentType, SUPPORTED_CONTENT_TYPES)) {
    case 'json':
      return jsonParser(reqOrContentType)(body);
    case 'urlencoded':
      return urlEncodedParser(reqOrContentType)(body);
    case 'application/octet-stream':
      return rawParser(reqOrContentType)(body);
    case 'text':
    case 'html':
      return textParser(reqOrContentType)(body);
    default:
      return undefined;
  }
};
