import * as uuid from 'uuid';

export class ContextToken<T = any> {
  _id = uuid();
  _T!: T;
  constructor(public name?: string) {}
}

export const createContextToken = <T>(name?: string) =>
  new class extends ContextToken<T> {
    constructor() { super(name); }
  };
