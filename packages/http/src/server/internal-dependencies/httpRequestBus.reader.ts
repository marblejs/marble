import { Subject } from 'rxjs';
import { createContextToken, createReader } from '@marblejs/core';
import { HttpRequest } from '../../http.interface';

export type HttpRequestBus = ReturnType<typeof HttpRequestBus>;

export const HttpRequestBusToken = createContextToken<HttpRequestBus>('HttpRequestBus');

export const HttpRequestBus = createReader(_ => new Subject<HttpRequest>());
