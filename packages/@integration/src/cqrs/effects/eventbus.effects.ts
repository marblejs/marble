/* eslint-disable @typescript-eslint/no-unused-vars */

import { of } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';
import { pipe } from 'fp-ts/lib/pipeable';
import { act, matchEvent, useContext, LoggerToken, LoggerTag } from '@marblejs/core';
import { MsgEffect, EventBusClientToken } from '@marblejs/messaging';
import { GenerateOfferDocumentCommand } from '../domain/Offer.command';
import { OfferDocumentSavedEvent, OfferDocumentCreatedEvent } from '../domain/Offer.event';
import { SomeDependencyToken } from '../__mock__/__mock__dependencies';

const tag = LoggerTag.EVENT_BUS;

export const generateOfferDocument$: MsgEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);
  const _1 = useContext(SomeDependencyToken)(ctx.ask);
  const _2 = useContext(EventBusClientToken)(ctx.ask);

  return event$.pipe(
    matchEvent(GenerateOfferDocumentCommand),
    act(event => pipe(
      of(event.payload.offerId),
      tap(logger({ tag, type: 'generateOfferDocument$', message: 'Generating offer document...'})),
      delay(5 * 1000),
      map(offerId => OfferDocumentCreatedEvent.create({ offerId })),
    )),
  );
}

export const offerDocumentCreated$: MsgEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(OfferDocumentCreatedEvent),
    act(event => pipe(
      of(event.payload.offerId),
      tap(logger({ tag, type: 'saveOfferDocument$', message: 'Saving offer document...'})),
      delay(5 * 1000),
      map(OfferDocumentSavedEvent.create),
    )),
  );
}
