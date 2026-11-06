import api from './api'

export default function mediaUrl(path) {
  if (!path) return ''
  const apiOrigin = new URL(api.defaults.baseURL, window.location.origin).origin
  return new URL(path, `${apiOrigin}/`).toString()
}
