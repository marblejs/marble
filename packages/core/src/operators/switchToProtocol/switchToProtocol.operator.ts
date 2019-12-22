import { Observable, iif, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { HttpRequest, HttpStatus } from '../../http/http.interface';

export const switchToProtocol = <I extends HttpRequest>
  (protocol: string) =>
  (source$: Observable<I>) =>
    source$.pipe(
      mergeMap(({ headers }) => iif(
        () => (headers.upgrade !== protocol || headers.connection !== 'upgrade'),
        of({
          status: HttpStatus.UPGRADE_REQUIRED,
          headers: { 'Upgrade': protocol },
        }),
        of({
          status: HttpStatus.SWITCHING_PROTOCOLS,
        }),
      )),
    );
