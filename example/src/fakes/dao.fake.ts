import { of } from 'rxjs';

export namespace Dao {

  export const getUsers = () => of([
    { id: '1', firstName: 'Bob', lastName: 'Bob' },
    { id: '2', firstName: 'Bob', lastName: 'Bob' },
  ]);

  export const postUser = (data: any) => of({
    data
  });

}
