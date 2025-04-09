import { RouteDefinition, ValidationSchema } from '../types/types.js'

let routeRegistry: RouteDefinition[] = []

export const defineRoute = <
  TResult = unknown,
  S extends ValidationSchema = ValidationSchema,
>(
  route: RouteDefinition<TResult, S>
) => {
  routeRegistry.push(route)
}

export const getAllRoutes = (): RouteDefinition[] => {
  return routeRegistry
}

// For testing purposes
export const $clearRoutes = () => {
  routeRegistry = []
}
