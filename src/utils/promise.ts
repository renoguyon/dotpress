export const isPromise = (p: unknown): boolean => {
  return (
    ['catch', 'then', 'finally'].every((name) => {
      return typeof Object(p)[name] === 'function'
    }) &&
    // for custom Promise libraries like bluebird.js
    ['all', 'allSettled', 'race', 'reject', 'resolve'].every((name) => {
      return typeof Object(p).constructor[name] === 'function'
    })
  )
}
