import { join } from 'path';
import { createWriteStream } from 'fs';
import { HttpResponse } from '@marblejs/core';
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

  test('#filterResponse filters request by given predicate function', () => {
    // given
    const res = { status: 404 } as any as HttpResponse;
    const predicate = res => res.status < 400;

    // when
    const resultWithPredicateFunction = filterResponse({ filter: predicate })(res);
    const resultWithoutPredicateFunction = filterResponse({})(res);

    // then
    expect(resultWithPredicateFunction).toEqual(false);
    expect(resultWithoutPredicateFunction).toEqual(true);
  });

  test('#isNotSilent checks if options "silent" flag is set', () => {
    // given
    const optsSilent = isNotSilent({ silent: true });
    const optsNotSilent = isNotSilent({ silent: false });
    const optsWithoutSilent = isNotSilent({});

    // then
    expect(optsSilent()).toEqual(false);
    expect(optsNotSilent()).toEqual(true);
    expect(optsWithoutSilent()).toEqual(true);
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
