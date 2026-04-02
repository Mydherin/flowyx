import { api } from './api'
import type { UserSearchResult } from '../types/sharing'

export const userService = {
  search: (q: string) =>
    api.get<UserSearchResult[]>(`/api/v1/users/search?q=${encodeURIComponent(q)}`),
}
