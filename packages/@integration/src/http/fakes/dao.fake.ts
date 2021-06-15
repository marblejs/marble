import { of, throwError } from 'rxjs';

export const Dao = {
  getUsers: () => of([
    { id: '1', firstName: 'Bob', lastName: 'Collins' },
    { id: '2', firstName: 'Sara', lastName: 'Rodriguez' },
    { id: '3', firstName: 'Adam', lastName: 'Wayne' },
  ]),

  getUserById: (id: number | string) =>
    String(id) !== String(0)
      ? of({ id, firstName: 'Bob', lastName: 'Collins' })
      : throwError(() => new Error()),

  postUser: <T>(data: T) => of({
    data,
  }),
};
