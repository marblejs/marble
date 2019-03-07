import { checkRegexpOrigin } from '../checkRegexpOrigin';

describe('checkStringOrigin', () => {
  test('check regexp option correctly', done => {
    const option1 = /[a-z]/;
    const option2 = /[0-9]/;

    expect(checkRegexpOrigin('fake-origin', option1)).toBeTruthy();
    expect(checkRegexpOrigin('fake-origin', option2)).toBeFalsy();
    done();
  });
});
