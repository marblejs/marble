import { r, HttpStatus, useContext, use } from '@marblejs/core';
import { tap, mapTo, map } from 'rxjs/operators';
import { EventBusClientToken } from '@marblejs/messaging';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { OfferCommand } from '../domain/Offer.command';

const generateDocumentValidator$ = requestValidator$({
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
      use(generateDocumentValidator$),
      map(req => OfferCommand.generateOffer(req.params.id)),
      tap(eventBusClient.emit),
      mapTo({ status: HttpStatus.ACCEPTED }),
    );
  }));
