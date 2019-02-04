import { compose } from '@marblejs/core/dist/+internal';
import { BodyParser } from '../body.model';

const decodeComponent = (urlEncoded: string) => urlEncoded
  .split('&')
  .map(x => x.split('='))
  .reduce((data, [key, value]) => ({
    ...data,
    [key]: isNaN(+value) ? value : +value,
  }), {});

export const urlEncodedParser: BodyParser = _ => body =>
  compose(decodeComponent, decodeURIComponent)(body.toString());
