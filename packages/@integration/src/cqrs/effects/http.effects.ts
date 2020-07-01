import { r, HttpStatus, useContext } from '@marblejs/core';
import { tap, mapTo, map } from 'rxjs/operators';
import { EventBusClientToken } from '@marblejs/messaging';
import { validateRequest, t } from '@marblejs/middleware-io';
import { GenerateOfferDocumentCommand } from '../domain/Offer.command';

const validate = validateRequest({
  params: t.type({
    id: t.string,
  }),
});

export const postDocumentsGenerate$ = r.pipe(
  r.matchPath('/documents/:id/generate'),
  r.matchType('POST'),
  r.useEffect((req$, ctx) => {
    const eventBusClient = useContext(EventBusClientToken)(ctx.ask);

    return req$.pipe(
      validate,
      map(req => GenerateOfferDocumentCommand.create({ offerId: req.params.id })),
      tap(eventBusClient.emit),
      mapTo({ status: HttpStatus.ACCEPTED }),
    );
  }));
