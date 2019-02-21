import * as uuid from 'uuid';

export class ContextToken<T = any> {
  _id = uuid();
  _T!: T;
}

export const createContextToken = <T>() =>
  new class extends ContextToken<T> {};
