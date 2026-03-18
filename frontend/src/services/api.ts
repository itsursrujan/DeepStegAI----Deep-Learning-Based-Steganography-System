import axios, { AxiosError } from 'axios'
import { useStore } from '@/store/useStore'

const api = axios.create({
  baseURL: '/api',
})

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add a response interceptor to sync credits and handle common errors
api.interceptors.response.use(
  (response) => {
    // Sync Credits from Body (Standardized Envelope)
    const creditsFromBody = response.data?.data?.credits || response.data?.credits
    if (typeof creditsFromBody === 'number') {
      useStore.getState().setCredits(creditsFromBody)
    }

    // Sync Credits from Header (X-Updated-Credits)
    const creditsFromHeader = response.headers['x-updated-credits']
    if (creditsFromHeader) {
      useStore.getState().setCredits(parseInt(creditsFromHeader, 10))
    }

    return response
  },
  async (error) => {
    // Handle 402 Insufficient Credits
    if (error.response?.status === 402) {
      const msg = error.response?.data?.message || "Insufficient Neural Credits for this operation."
      // Optionally trigger a global alert or notification here
      console.warn('CREDIT_EXHAUSTION:', msg)
    }
    return Promise.reject(error)
  }
)

// Helper: when responseType is 'blob' but server returns a JSON error,
// parse the blob back into a readable error message.
async function readBlobError(err: AxiosError): Promise<string> {
  try {
    const blob = err.response?.data as Blob
    if (blob && blob.type?.includes('application/json')) {
      const text = await blob.text()
      const json = JSON.parse(text)
      return json.error || 'Server error'
    }
  } catch (_) {}
  return (err.response?.data as any)?.error || err.message || 'Unknown error'
}

export const stegoApi = {
  // --- Auth ---
  login: (data: any) => api.post('/auth/login', data),
  signup: (data: any) => api.post('/auth/signup', data),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),

  // --- Core ---
  embed: (formData: FormData) =>
    api.post('/embed', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  extract: async (formData: FormData) => {
    try {
      return await api.post('/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      })
    } catch (err: any) {
      const msg = await readBlobError(err)
      throw { ...err, message: msg, response: { ...err.response, data: { error: msg } } }
    }
  },

  analyze: (formData: FormData) =>
    api.post('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  batch: async (formData: FormData) => {
    try {
      return await api.post('/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      })
    } catch (err: any) {
      const msg = await readBlobError(err)
      throw { ...err, message: msg, response: { ...err.response, data: { error: msg } } }
    }
  },

  batchAnalyze: (formData: FormData) =>
    api.post('/batch_analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  contact: (data: any) =>
    api.post('/contact', data, {
      headers: { 'Content-Type': 'application/json' },
    }),

  getMessages: () => api.get('/messages'),
  getAnalysisList: () => api.get('/analysis'),
  getFiles: () => api.get('/files'),
  getCredits: () => api.get('/credits'),
}

export default api
