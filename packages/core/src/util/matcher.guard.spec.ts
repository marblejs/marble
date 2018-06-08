import { HttpRequest } from '../http.interface';
import { isRequestNotMatched, matchGuard } from './matcher.guard';

describe('Matcher guard', () => {

  test('#isRequestNotMatched checks if request was matched', () => {
    // given
    const notMatchedReq = { matchType: true, matchPath: false } as HttpRequest;

    // when
    const isNotMatched = isRequestNotMatched(notMatchedReq);

    // then
    expect(isNotMatched).toBe(true);
  });

  test(`#matchGuard resets matchers if matching predicate is false and request wasn't matched`, () => {
    // given
    const req = { matchType: true, matchPath: false } as HttpRequest;
    const expectedReq = { matchType: false, matchPath: false } as HttpRequest;

    // when
    const matchingResult = matchGuard(false)(req);

    // then
    expect(matchingResult).toBe(false);
    expect(req).toEqual(expectedReq);
  });

});
