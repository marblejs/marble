export const getArrayFromEnum = (E: Object) =>
  Object.keys(E).filter(key => typeof E[key as any] === 'number');
