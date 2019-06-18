import { OneOrMore } from './testing.types';

type Deserializer<T, R> = (...data: OneOrMore<T>) => R;
type Matcher<T> = (d1: T, d2: T) => boolean;

interface Group<T> {
  baseElement: T;
  elements: OneOrMore<T>;
}

const isArrayOfArrays = <T>(data: T[] | T[][]): data is T[][] => Array.isArray(data[0]);
const flattenArrayOfArrays = <T>(data: T[][]) => data.reduce((result, elements) => {
  result.push(...elements);
  return result;
}, [] as T[]);

/**
 * Allows to join multiple elements together (N raw elements get merged into N or less elements).
 * The use case is to merge multiple collections created asynchronously from various places in tests into single set of collections.
 *
 * ### Example
 * ```
 * Input:
 * - elements with names: A, A, B, B, B, C, C
 * - matcher that matches elements by names
 * - serializer that creates V(X1, X2, X3) out of X1, X2, X3...
 * Output:
 * - [V(A, A), V(B, B, B), V(C, C)]
 * ```
 */
export const join = <T, R>(elements: T[] | T[][], matcher: Matcher<T>, deserialize: Deserializer<T, R>): R[] => {
  if (!elements.length) {
    return [];
  }
  if (isArrayOfArrays(elements)) {
    elements = flattenArrayOfArrays(elements);
  }
  const groups: Group<T>[] = [];
  for (const e of elements) {
    const foundGroup = groups.find(group => matcher(group.baseElement, e));
    if (!foundGroup) {
      groups.push({ baseElement: e, elements: [e] });
    } else {
      foundGroup.elements.push(e);
    }
  }
  return groups.map(group => deserialize(...group.elements));
};
