import { createUuid } from '../+internal/utils';

export class ContextToken<T = any> {
  _id = createUuid();
  _T!: T;
  constructor(public name?: string) {}
}

export const createContextToken = <T>(name?: string) =>
  new class extends ContextToken<T> {
    constructor() { super(name); }
  };
