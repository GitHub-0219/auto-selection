/**
 * API 客户端配置
 */

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加Token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转登录
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// API 函数
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  getProfile: () =>
    apiClient.get('/auth/profile'),
  getMembership: () =>
    apiClient.get('/auth/membership'),
}

export const aiAPI = {
  analyzeProducts: (keywords: string[]) =>
    apiClient.post('/ai/analyze-products', { keywords }),
  translate: (content: string, targetLang: string) =>
    apiClient.post('/ai/translate', { content, targetLang }),
  suggestPrice: (cost: number, targetMarket: string) =>
    apiClient.post('/ai/suggest-price', { cost, targetMarket }),
  getCapabilities: () =>
    apiClient.get('/ai/capabilities'),
}

export const productAPI = {
  getAll: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/products', { params }),
  getOne: (id: string) =>
    apiClient.get(`/products/${id}`),
  create: (data: any) =>
    apiClient.post('/products', data),
  update: (id: string, data: any) =>
    apiClient.put(`/products/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/products/${id}`),
}

export default apiClient
