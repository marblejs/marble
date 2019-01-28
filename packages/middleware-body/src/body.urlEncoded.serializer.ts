export const serializeUrlEncoded = (formData: string) => formData
  .split('&')
  .map(x => x.split('='))
  .reduce((data, [key, value]) => ({
    ...data,
    [key]: isNaN(+value) ? value : +value,
  }), {});
