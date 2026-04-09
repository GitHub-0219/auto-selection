/**
 * 全局类型定义
 */

// 用户相关类型
export interface User {
  id: string
  name: string
  email: string
  role: 'free' | 'basic' | 'pro' | 'enterprise'
  createdAt: Date
  updatedAt: Date
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

// 商品相关类型
export interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  images: string[]
  status: 'active' | 'inactive' | 'draft'
  createdAt: Date
  updatedAt: Date
}

// 订单相关类型
export interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  currency: string
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

// 会员相关类型
export interface Membership {
  id: string
  userId: string
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'expired' | 'cancelled'
  startDate: Date
  endDate: Date
  features: string[]
}

// AI对话相关类型
export interface AIConversation {
  id: string
  title: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页类型
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Mock API 特定类型
export interface MockProduct {
  id: string
  name: string
  price: number
  category: string
  stock?: number
  sales?: number
}

export interface AISelectResult {
  recommended: {
    name: string
    score: number
    trend: '上升' | '下降' | '稳定'
    competition: '高' | '中' | '低'
  }[]
  insights: string[]
}

export interface PriceSuggestion {
  costPrice: number
  targetMarket: string
  suggestedPrice: number
  profit: number
  margin: string
}

export interface MarketInsight {
  region: string
  growth: string
  topCategories: string[]
}

export interface Language {
  code: string
  name: string
}
