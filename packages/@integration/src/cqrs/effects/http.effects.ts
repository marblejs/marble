import { useContext } from '@marblejs/core';
import { r, HttpStatus } from '@marblejs/http';
import { EventBusClientToken } from '@marblejs/messaging';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { tap, mapTo, map } from 'rxjs/operators';
import { GenerateOfferDocumentCommand } from '../domain/Offer.command';

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
      generateDocumentValidator$,
      map(req => GenerateOfferDocumentCommand.create({ offerId: req.params.id })),
      tap(eventBusClient.emit),
      mapTo({ status: HttpStatus.ACCEPTED }),
    );
  }));
