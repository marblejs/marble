import { checkArrayOrigin } from '../checkArrayOrigin';

describe('checkArrayOrigin', () => {
  test('check array option correctly', done => {
    const option1 = ['fake-origin'];
    const option2 = ['fake-origin-2'];

    expect(checkArrayOrigin('fake-origin', option2)).toBeFalsy();
    expect(checkArrayOrigin('fake-origin', option1)).toBeTruthy();
    done();
  });
});
