import { ContentType, getContentType } from '@marblejs/core/dist/+internal/http';
import { RequestBodyParser } from '../body.model';
import { jsonParser } from './json.body.parser';
import { textParser } from './text.body.parser';
import { rawParser } from './raw.body.parser';
import { urlEncodedParser } from './url.body.parser';

export const defaultParser: RequestBodyParser = reqOrContentType => body => {
  const contentType = typeof reqOrContentType === 'string'
    ? reqOrContentType
    : getContentType(reqOrContentType.headers);

  switch (contentType) {
    case ContentType.APPLICATION_JSON:
      return jsonParser(reqOrContentType)(body);
    case ContentType.APPLICATION_X_WWW_FORM_URLENCODED:
      return urlEncodedParser(reqOrContentType)(body);
    case ContentType.APPLICATION_OCTET_STREAM:
      return rawParser(reqOrContentType)(body);
    case ContentType.TEXT_PLAIN:
      return textParser(reqOrContentType)(body);
    default:
      return undefined;
  }
};
