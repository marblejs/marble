import { checkStringOrigin } from '../checkStringOrigin';

describe('checkStringOrigin', () => {
  test('check string option correctly', done => {
    const option1 = 'fake-origin';
    const option2 = 'fake-origin-2';

    expect(checkStringOrigin('fake-origin', option1)).toBeTruthy();
    expect(checkStringOrigin('fake-origin', option2)).toBeFalsy();
    done();
  });
});
