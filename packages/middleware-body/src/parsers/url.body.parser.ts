import { compose } from '@marblejs/core/dist/+internal';
import { RequestBodyParser } from '../body.model';

const decodeComponent = (urlEncoded: string) => urlEncoded
  .split('&')
  .map(x => x.split('='))
  .reduce((data, [key, value]) => ({
    ...data,
    [key]: isNaN(+value) ? value : +value,
  }), {});

export const urlEncodedParser: RequestBodyParser = _ => body =>
  compose(decodeComponent, decodeURIComponent)(body.toString());
