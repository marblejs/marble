import { checkOrigin } from '../checkOrigin';
import { createMockRequest } from '../util';

describe('checkOrigin', () => {
  test('check wildcard option correctly', done => {
    const option = '*';
    const req = createMockRequest('GET', { origin: 'fake-origin' });

    expect(checkOrigin(req, option)).toBeTruthy();
    done();
  });

  test('check string option correctly', done => {
    const option1 = 'fake-origin';
    const option2 = 'fake-origin-2';
    const req1 = createMockRequest('GET', { origin: 'fake-origin' });
    const req2 = createMockRequest('GET', { origin: 'fake-origin' });

    expect(checkOrigin(req1, option1)).toBeTruthy();
    expect(checkOrigin(req2, option2)).toBeFalsy();
    done();
  });

  test('check array option correctly', done => {
    const option1 = ['fake-origin-b', 'fake-origin-a'];
    const option2 = ['another-origin-a', 'another-origin-b'];
    const req1 = createMockRequest('GET', { origin: 'fake-origin-a' });
    const req2 = createMockRequest('GET', { origin: 'fake-origin-c' });

    expect(checkOrigin(req1, option1)).toBeTruthy();
    expect(checkOrigin(req2, option2)).toBeFalsy();
    done();
  });

  test('check regexp option correctly', done => {
    const option1 = /[a-z]/;
    const option2 = /[0-9]/;
    const req1 = createMockRequest('GET', { origin: 'fake-origin-a' });
    const req2 = createMockRequest('GET', { origin: 'fake-origin-c' });

    expect(checkOrigin(req1, option1)).toBeTruthy();
    expect(checkOrigin(req2, option2)).toBeFalsy();
    done();
  });
});





