import { createEvent, EventsUnion } from '@marblejs/core';

export enum OfferCommandType {
  GENERATE_OFFER_DOCUMENT = 'GENERATE_OFFER_DOCUMENT',
};

export const OfferCommand = {
  generateOffer: createEvent(
    OfferCommandType.GENERATE_OFFER_DOCUMENT,
    (offerId: string) => ({ offerId }),
  ),
};

export type OfferCommand = EventsUnion<typeof OfferCommand>;
