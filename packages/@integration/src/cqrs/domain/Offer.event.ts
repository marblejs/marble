import { createEvent, EventsUnion } from '@marblejs/core';

export enum OfferEventType {
  OFFER_CREATED = 'OFFER_CREATED',
  OFFER_UPDATED = 'OFFER_UPDATED',
  OFFER_DOCUMENT_SAVED = 'OFFER_DOCUMENT_CREATED',
  OFFER_DOCUMENT_CREATED = 'OFFER_DOCUMENT_SAVED',
};

export const OfferEvent = {
  offerCreated: createEvent(
    OfferEventType.OFFER_CREATED,
    (offerId: string) => ({ offerId }),
  ),
  offerUpdated: createEvent(
    OfferEventType.OFFER_UPDATED,
    (offerId: string) => ({ offerId }),
  ),
  offerDocumentCreated: createEvent(
    OfferEventType.OFFER_DOCUMENT_CREATED,
    (offerId: string) => ({ offerId }),
  ),
  offerDocumentSaved: createEvent(
    OfferEventType.OFFER_DOCUMENT_SAVED,
  ),
};

export type OfferEvent = EventsUnion<typeof OfferEvent>;
