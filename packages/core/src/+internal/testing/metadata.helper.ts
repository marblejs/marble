import { HttpHeaders, HttpRequest, HttpResponse } from '../../http.interface';
import { JSONSchema7 } from 'json-schema';

export interface TestingMetadata {
  path: string;
  body?: JSONSchema7;
  headers?: JSONSchema7;
  params?: JSONSchema7;
  query?: JSONSchema7;
}

export const TESTING_HEADER = 'X-Marble-Testing';

export const stripMetadataHeader = (headers: HttpHeaders): TestingMetadata => {
  const key = TESTING_HEADER.toLowerCase();
  const header = headers[key];
  delete headers[key];
  return JSON.parse(decodeURIComponent(header as string));
};

export const isTestingMetadataOn = () => process.env.MARBLE_TESTING_METADATA_ON === 'true';

export const setMetadataHeader = (response: HttpResponse, meta: TestingMetadata) =>
  response.setHeader(TESTING_HEADER, encodeURIComponent(JSON.stringify(meta)));

export const applyMetadata = (req: HttpRequest, res: HttpResponse) => {
  if (!isTestingMetadataOn()) {
    return;
  }

  setMetadataHeader(res, req.meta as any);
};
