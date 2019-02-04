import { ContentType } from '@marblejs/core/dist/+internal';
import { BodyParser } from '../body.model';
import { jsonParser } from './json.body.parser';
import { textParser } from './text.body.parser';
import { rawParser } from './raw.body.parser';
import { urlEncodedParser } from './url.body.parser';

export const defaultParser: BodyParser = req => body => {
  switch (req.headers['content-type']) {
    case ContentType.APPLICATION_JSON:
      return jsonParser(req)(body);
    case ContentType.APPLICATION_X_WWW_FORM_URLENCODED:
      return urlEncodedParser(req)(body);
    case ContentType.APPLICATION_OCTET_STREAM:
      return rawParser(req)(body);
    case ContentType.TEXT_PLAIN:
      return textParser(req)(body);
    default:
      return undefined;
  }
};
