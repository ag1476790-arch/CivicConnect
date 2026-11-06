import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  let authUser = null
  try {
    authUser = JSON.parse(sessionStorage.getItem('civicconnect-user') || 'null')
  } catch {
    sessionStorage.removeItem('civicconnect-user')
  }
  if (authUser && authUser.token) {
    config.headers.Authorization = `Token ${authUser.token}`
  }
  return config
})

export default api
