export class IxBuilder<I, O, A> {
  readonly _A: A | undefined;
  readonly _L: O | undefined;
  readonly _U: I | undefined;

  constructor(readonly spec: A) {}

  run(): A {
    return this.spec;
  }

  map<B>(f: (a: A) => B): IxBuilder<I, O, B> {
    return new IxBuilder(f(this.spec));
  }

  ichain<Z, B>(f: (a: A) => IxBuilder<O, Z, B>): IxBuilder<I, Z, B> {
    return new IxBuilder(f(this.spec).run());
  }
}

export const map = <I, O, A, B>
  (fa: IxBuilder<I, O, A>, f: (a: A) => B): IxBuilder<I, O, B> =>
    fa.map(f);

export const iof = <I, A>
  (a: A): IxBuilder<I, I, A> =>
    new IxBuilder(a);

export const ichain = <I, O, Z, A, B>
  (fa: IxBuilder<I, O, A>, f: (a: A) => IxBuilder<O, Z, B>): IxBuilder<I, Z, B> =>
    fa.ichain(f);

export const ichainCurry = <I, O, Z, A, B>
  (f: (a: A) => IxBuilder<O, Z, B>) =>
  (fa: IxBuilder<I, O, A>): IxBuilder<I, Z, B> =>
    fa.ichain(f);
