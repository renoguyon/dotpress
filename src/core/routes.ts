import {
  FileRules,
  RouteDefinition,
  RouteGroup,
  RouteMiddleware,
  ValidationSchema,
} from '../types/types.js'

let routeRegistry: RouteDefinition[] = []

export const defineRoute = <
  TResult = unknown,
  S extends ValidationSchema = ValidationSchema,
  TFile extends FileRules | undefined = undefined,
>(
  route: RouteDefinition<TResult, S, TFile>
) => {
  routeRegistry.push(route as unknown as RouteDefinition)
}

export const getAllRoutes = (): RouteDefinition[] => {
  return routeRegistry
}

// For testing purposes
export const $clearRoutes = () => {
  routeRegistry = []
}

export const createRouteGroup = (
  prefix: string,
  middlewares: RouteMiddleware[] = []
): RouteGroup => {
  return {
    defineRoute: (routeConfig) => {
      return defineRoute({
        ...routeConfig,
        path: `${prefix}${routeConfig.path}`,
        middlewares: [...middlewares, ...(routeConfig.middlewares ?? [])],
      })
    },
    createGroup: (subPrefix, subMiddlewares = []) => {
      return createRouteGroup(`${prefix}${subPrefix}`, [
        ...middlewares,
        ...subMiddlewares,
      ])
    },
  }
}
