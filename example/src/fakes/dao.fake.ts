import { of } from 'rxjs';

export namespace Dao {

  export const getUsers = () => of([
      { id: '1', firstName: 'Bob', lastName: 'Collins' },
      { id: '2', firstName: 'Sara', lastName: 'Rodriguez' },
      { id: '3', firstName: 'Adam', lastName: 'Wayne' },
    ]);

  export const postUser = (data: any) => of({
      data
    });

}
