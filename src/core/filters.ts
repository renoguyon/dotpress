import { ResponseFilter } from '../types/types.js'

let responseFilters: ResponseFilter[] = []

export const registerResponseFilter = (filter: ResponseFilter) => {
  responseFilters.push(filter)
}

export const getResponseFilters = (): ResponseFilter[] => {
  return responseFilters
}

// For testing purposes
export const $clearResponseFilters = () => {
  responseFilters = []
}
