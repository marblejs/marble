import * as t from 'io-ts';
import { event } from '@marblejs/core';

export enum OfferCommandType {
  GENERATE_OFFER_DOCUMENT = 'GENERATE_OFFER_DOCUMENT',
}

export const GenerateOfferDocumentCommand =
  event(OfferCommandType.GENERATE_OFFER_DOCUMENT)(t.type({ offerId: t.string }));
