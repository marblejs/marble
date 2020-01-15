import { HttpRequest } from '@marblejs/core';
import { createHttpRequest, createHttpResponse } from '@marblejs/core/dist/+internal/testing';
import { formatTime, getTimeDifferenceInMs, filterResponse, isNotSilent } from '../logger.util';

describe('Logger util', () => {
  test('#formatTime formats time to miliseconds or seconds', () => {
    // given
    const moreThanSecond = 1200;
    const lessThanSecond = 800;

    // when
    const formattedSecond = formatTime(moreThanSecond);
    const formattedMilisecond = formatTime(lessThanSecond);

    // then
    expect(formattedSecond).toBe('+1.2s');
    expect(formattedMilisecond).toBe('+800ms');
  });

  test('#getTimeDifferenceInMs returns time difference in miliseconds', () => {
    // given
    const startTime = new Date(1000);
    spyOn(global, 'Date').and.returnValue({ getTime: () => 2000 });

    // when
    const timeDifference = getTimeDifferenceInMs(startTime);

    // then
    expect(timeDifference).toBe(2000 - 1000);
  });

  test('#filterResponse filters response by given predicate function', () => {
    // given
    const response = createHttpResponse({ statusCode: 404 });
    const req = createHttpRequest({ url: '/bar', response });
    const predicate = (req: HttpRequest) => req.response.statusCode < 400;

    // when
    const resultWithPredicateFunction = filterResponse({ filter: predicate })(req);
    const resultWithoutPredicateFunction = filterResponse({})(req);

    // then
    expect(resultWithPredicateFunction).toEqual(false);
    expect(resultWithoutPredicateFunction).toEqual(true);
  });

  test('#filterResponse filters request by given predicate function', () => {
    // given
    const response = createHttpResponse({ statusCode: 404 });
    const req = createHttpRequest({ url: '/bar', response });
    const predicate = (req: HttpRequest) => req.url.includes('/foo');

    // when
    const resultWithPredicateFunction = filterResponse({ filter: predicate })(req);
    const resultWithoutPredicateFunction = filterResponse({})(req);

    // then
    expect(resultWithPredicateFunction).toEqual(false);
    expect(resultWithoutPredicateFunction).toEqual(true);
  });

  test('#isNotSilent checks if options "silent" flag is set', () => {
    // given
    const req = createHttpRequest();
    const optsSilent = isNotSilent({ silent: true });
    const optsNotSilent = isNotSilent({ silent: false });
    const optsWithoutSilent = isNotSilent({});

    // then
    expect(optsSilent(req)).toEqual(false);
    expect(optsNotSilent(req)).toEqual(true);
    expect(optsWithoutSilent(req)).toEqual(true);
  });
});
