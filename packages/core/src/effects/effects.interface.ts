import * as http from 'http';
import { Observable, SchedulerLike } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus, HttpHeaders } from '../http.interface';
import { HttpError } from '../error/error.model';
import { InjectorGetter } from '../server/server.injector';
import { Event } from '../event/event.interface';

export interface HttpEffectResponse<T = any> {
  status?: HttpStatus;
  headers?: HttpHeaders;
  body?: T;
}

export interface HttpMiddleware<
  I extends HttpRequest = HttpRequest,
  O extends HttpRequest = HttpRequest,
> extends HttpEffect<I, O> {}

export interface HttpErrorEffect<T extends Error = HttpError>
  extends HttpEffect<HttpRequest, HttpEffectResponse, HttpResponse, T> {}

export interface HttpServerEffect<T extends Event = Event>
  extends HttpEffect<T, any, http.Server> {}

export interface HttpOutputEffect<T extends HttpEffectResponse = HttpEffectResponse>
  extends HttpEffect<T, HttpEffectResponse> {}

export interface HttpEffect<
  T = HttpRequest,
  U = HttpEffectResponse,
  V = HttpResponse,
  W extends Error = Error,
> extends Effect<T, U, V, W> {}

// common effect interfaces

export interface EffectLike {
  (input$: Observable<any>, ...args: any[]): Observable<any>;
}

export interface Effect<I, O, C, E extends Error = Error> {
  (input$: Observable<I>, client: C, meta: EffectMetadata<E>): Observable<O>;
}

export interface EffectMetadata<T extends Error = Error> {
  inject: InjectorGetter;
  scheduler: SchedulerLike;
  error?: T;
  [key: string]: any;
}
