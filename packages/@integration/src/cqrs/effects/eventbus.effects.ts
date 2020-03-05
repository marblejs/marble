import { of } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';
import { act, matchEvent, useContext, LoggerToken, LoggerTag } from '@marblejs/core';
import { MsgEffect } from '@marblejs/messaging';
import { OfferCommand } from '../domain/Offer.command';
import { OfferEvent } from '../domain/Offer.event';

const tag = LoggerTag.EVENT_BUS;

export const generateOfferDocument$: MsgEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(OfferCommand.generateOffer),
    act(event => of(event).pipe(
      map(event => event.payload.offerId),
      tap(logger({ tag, type: 'generateOfferDocument$', message: 'Generating offer document...'})),
      delay(5 * 1000),
      map(offerId => OfferEvent.offerDocumentCreated(offerId)),
    )),
  );
}

export const saveOfferDocument$: MsgEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(OfferEvent.offerDocumentCreated),
    act(event => of(event).pipe(
      map(event => event.payload.offerId),
      tap(logger({ tag, type: 'saveOfferDocument$', message: 'Saving offer document...'})),
      delay(5 * 1000),
      map(OfferEvent.offerDocumentSaved),
    )),
  );
}
