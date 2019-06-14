import { HttpHeaders, HttpRequest, HttpResponse } from '../../http.interface';

export interface TestingMetadata {
  path: string;
  params: Record<string, any>;
  query: Record<string, any>;
}

export const TESTING_HEADER = 'X-Marble-Testing';

export const stripMetadataHeader = (headers: HttpHeaders): TestingMetadata => {
  const key = TESTING_HEADER.toLowerCase();
  const header = headers[key];
  delete headers[key];
  return JSON.parse(decodeURIComponent(header as string));
};

export const setMetadataHeader = (response: HttpResponse, meta: TestingMetadata) =>
  response.setHeader(TESTING_HEADER, encodeURIComponent(JSON.stringify(meta)));

export const applyMetadata = (req: HttpRequest, res: HttpResponse) => {
  if (!process.env.MARBLE_TESTING_METADATA_ON) {
    return;
  }
  const { meta, params, query } = req;
  const testingMetadata: TestingMetadata = {
    path: meta.path,
    params: params as any,
    query: query as any,
  };

  setMetadataHeader(res, testingMetadata);
};
