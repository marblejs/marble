import { join } from 'path';
import { createWriteStream } from 'fs';
import { createHttpRequest, createHttpResponse } from '@marblejs/core/dist/+internal/testing';
import { formatTime, getTimeDifferenceInMs, filterResponse, isNotSilent, writeToStream } from '../logger.util';

describe('Logger util', () => {
  test('#formatTime formats time to miliseconds or seconds', () => {
    // given
    const moreThanSecond = 1200;
    const lessThanSecond = 800;

    // when
    const formattedSecond = formatTime(moreThanSecond);
    const formattedMilisecond = formatTime(lessThanSecond);

    // then
    expect(formattedSecond).toBe('1.2s');
    expect(formattedMilisecond).toBe('800ms');
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
    const req = createHttpRequest({ url: '/bar' });
    const res = createHttpResponse({ statusCode: 404 });
    const predicate = res => res.status < 400;

    // when
    const resultWithPredicateFunction = filterResponse({ filter: predicate })({ req, res });
    const resultWithoutPredicateFunction = filterResponse({})({ req, res });

    // then
    expect(resultWithPredicateFunction).toEqual(false);
    expect(resultWithoutPredicateFunction).toEqual(true);
  });

  test('#filterResponse filters request by given predicate function', () => {
    // given
    const req = createHttpRequest({ url: '/bar' });
    const res = createHttpResponse({ statusCode: 404 });
    const predicate = (res, req) => req.url.includes('/foo');

    // when
    const resultWithPredicateFunction = filterResponse({ filter: predicate })({ req, res });
    const resultWithoutPredicateFunction = filterResponse({})({ req, res });

    // then
    expect(resultWithPredicateFunction).toEqual(false);
    expect(resultWithoutPredicateFunction).toEqual(true);
  });

  test('#isNotSilent checks if options "silent" flag is set', () => {
    // given
    const req = createHttpRequest();
    const res = createHttpResponse();
    const optsSilent = isNotSilent({ silent: true });
    const optsNotSilent = isNotSilent({ silent: false });
    const optsWithoutSilent = isNotSilent({});

    // then
    expect(optsSilent({ req, res })).toEqual(false);
    expect(optsNotSilent({ req, res })).toEqual(true);
    expect(optsWithoutSilent({ req, res })).toEqual(true);
  });

  test('#writeToStream writes to stream passed data chunk', () => {
    // given
    const writePath = join(__dirname, 'test.log');
    const stream = createWriteStream(writePath, { flags: 'a' });
    const data = 'AAA';
    const expectedWriteCall = 'AAA\n\n';

    // when
    jest.spyOn(stream, 'write').mockImplementation(jest.fn());
    writeToStream(stream, data);

    // then
    expect(stream.write).toHaveBeenCalledWith(expectedWriteCall);
  });
});
