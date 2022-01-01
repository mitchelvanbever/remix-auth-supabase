export const handlePromise = async <T extends object>(
  promise: Promise<T>,
): Promise<T[] | [undefined, any]> =>
  promise.then(result => [result]).catch(e => [undefined, e])
