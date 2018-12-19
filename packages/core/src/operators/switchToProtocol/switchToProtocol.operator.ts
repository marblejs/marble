import { Observable, iif, of } from 'rxjs';
import { mapTo, mergeMap } from 'rxjs/operators';
import { HttpStatus } from '../../http.interface';
import { HttpRequest } from '../../effects/effects.combiner';

export const switchToProtocol = <I extends HttpRequest>
  (protocol: string) =>
  (source$: Observable<I>) =>
    source$.pipe(
      mergeMap(req => iif(
        () => !(req.headers.upgrade === protocol),
        of(req).pipe(
          mapTo({
            status: HttpStatus.UPGRADE_REQUIRED,
            headers: { Upgrade: protocol },
          })
        ),
        of(req).pipe(
          mapTo({ status: HttpStatus.SWITCHING_PROTOCOLS }),
        ),
      )),
    );
