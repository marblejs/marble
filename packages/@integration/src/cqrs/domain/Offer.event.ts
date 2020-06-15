import * as t from 'io-ts';
import { event } from '@marblejs/core';

export const enum OfferEventType {
  OFFER_DOCUMENT_SAVED = 'OFFER_DOCUMENT_SAVED',
  OFFER_DOCUMENT_CREATED = 'OFFER_DOCUMENT_CREATED',
}

export const OfferDocumentCreatedEvent =
  event(OfferEventType.OFFER_DOCUMENT_CREATED)(t.type({ offerId: t.string }));

export const OfferDocumentSavedEvent =
  event(OfferEventType.OFFER_DOCUMENT_SAVED)();
