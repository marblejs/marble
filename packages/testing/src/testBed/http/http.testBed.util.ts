import { IO } from 'fp-ts/lib/IO';
import { TESTING_REQUEST_ID_HEADER } from '@marblejs/core/dist/+internal/testing';
import { createUuid } from '@marblejs/core/dist/+internal/utils';

export const createTestingRequestHeader = () => ({
  [TESTING_REQUEST_ID_HEADER]: createUuid(),
});

export const setTestingMetadata: IO<void> = () =>
  process.env.MARBLE_TESTING_METADATA_ON = 'true';
