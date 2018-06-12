import { TimeFactory } from './time.factory';

describe('TimeFactory', () => {

  test('#formatTime formats time to miliseconds or seconds', () => {
    // given
    const moreThanSecond = 1200;
    const lessThanSecond = 800;

    // when
    const formattedSecond = TimeFactory.formatTime(moreThanSecond);
    const formattedMilisecond = TimeFactory.formatTime(lessThanSecond);

    // then
    expect(formattedSecond).toBe('1.2s');
    expect(formattedMilisecond).toBe('800ms');
  });

  test('#getTimeDifferenceMs returns time difference in miliseconds', () => {
    // given
    const startTime = new Date(1000);
    spyOn(global, 'Date').and.returnValue({ getTime: () => 2000 });

    // when
    const timeDifference = TimeFactory.getTimeDifferenceMs(startTime);

    // then
    expect(timeDifference).toBe(2000 - 1000);
  });

});
