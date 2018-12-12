import { of, throwError } from 'rxjs';

export namespace Dao {

  export const getUsers = () => of([
    { id: '1', firstName: 'Bob', lastName: 'Collins' },
    { id: '2', firstName: 'Sara', lastName: 'Rodriguez' },
    { id: '3', firstName: 'Adam', lastName: 'Wayne' },
  ]);

  export const getUserById = (id: number | string) =>
    String(id) !== String(0)
      ? of({ id, firstName: 'Bob', lastName: 'Collins' })
      : throwError(new Error());

  export const postUser = <T>(data: T) => of({
    data,
  });

}
