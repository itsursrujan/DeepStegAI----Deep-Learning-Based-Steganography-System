import axios, { AxiosError } from 'axios'

const api = axios.create({
  baseURL: '/api',
})

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
}

export default api
