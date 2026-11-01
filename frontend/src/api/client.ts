import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '@/lib/storage'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshRequest: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) return null

  if (!refreshRequest) {
    refreshRequest = axios
      .post<{ access: string; refresh?: string }>(
        `${baseURL}/auth/token/refresh/`,
        { refresh },
      )
      .then((response) => {
        const access = response.data.access
        // Le backend fait tourner le refresh token : on conserve le nouveau
        // pour que la session reste valide après plusieurs renouvellements.
        tokenStorage.setTokens(access, response.data.refresh)
        return access
      })
      .catch(() => null)
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

api.interceptors.request.use(async (config) => {
  const isAuthEndpoint = config.url?.includes('/auth/token')
  let token = tokenStorage.getAccess()

  // Si le jeton d'accès a disparu mais que le refresh token est encore là,
  // on renouvelle avant d'envoyer la requête. Cela évite les actions
  // envoyées sans en-tête Authorization (donc refusées par l'API).
  if (!token && !isAuthEndpoint) {
    token = await refreshAccessToken()
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const isAuthEndpoint = original?.url?.includes('/auth/token')

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint
    ) {
      original._retry = true
      const access = await refreshAccessToken()
      if (access) {
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      }
      tokenStorage.clear()
      window.dispatchEvent(new Event('fongo:session-expired'))
    }

    return Promise.reject(error)
  },
)

export default api
