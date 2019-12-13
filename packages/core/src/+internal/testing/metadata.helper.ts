import { JSONSchema7 } from 'json-schema';
import { getHeaderValue } from '../utils/http.util';

export interface TestingMetadata {
  path?: string;
  body?: JSONSchema7;
  headers?: JSONSchema7;
  params?: JSONSchema7;
  query?: JSONSchema7;
}

export const TESTING_REQUEST_ID_HEADER = 'X-Testing-Request-Id';

export const isTestingMetadataOn = () => process.env.MARBLE_TESTING_METADATA_ON === 'true';

export const getTestingRequestIdHeader = getHeaderValue(TESTING_REQUEST_ID_HEADER);
