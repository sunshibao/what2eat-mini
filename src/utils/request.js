/**
 * uni.request 封装
 *  - baseURL（开发环境 http://localhost:8080/api）
 *  - 自动携带 Authorization
 *  - 统一错误处理
 *  - 请求 / 响应拦截
 */

import { useUserStore } from '@/stores/user'

// 不同环境的 baseURL
const BASE_URL_MAP = {
  development: 'http://localhost:8080/api',
  production: 'https://eat.skill86.com/api'
}

// uni-app 在小程序端 process.env.NODE_ENV 始终可用
const ENV = process.env.NODE_ENV || 'development'
export const BASE_URL = BASE_URL_MAP[ENV] || BASE_URL_MAP.development

// 全局请求超时
const TIMEOUT = 15000

/** 请求拦截 */
function applyRequestInterceptor(options) {
  const userStore = useUserStore()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.header || {})
  }
  if (userStore.token) {
    headers['Authorization'] = `Bearer ${userStore.token}`
  }
  return { ...options, header: headers }
}

/** 响应拦截 */
function applyResponseInterceptor(res) {
  // HTTP 层错误
  if (res.statusCode < 200 || res.statusCode >= 300) {
    return Promise.reject({
      code: res.statusCode,
      message: `网络异常 (${res.statusCode})`,
      raw: res
    })
  }
  const data = res.data || {}
  // 业务层错误（约定 code === 0 / 200 视为成功）
  const okCodes = [0, 200]
  if (data && typeof data.code !== 'undefined' && !okCodes.includes(data.code)) {
    // 401 未登录
    if (data.code === 401) {
      const userStore = useUserStore()
      userStore.logout()
      uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
    } else {
      uni.showToast({ title: data.message || '请求失败', icon: 'none' })
    }
    return Promise.reject({
      code: data.code,
      message: data.message || '请求失败',
      raw: data
    })
  }
  // 返回 data 字段（如果存在）否则整个 body
  return typeof data.data !== 'undefined' ? data.data : data
}

/**
 * 通用请求方法
 * @param {Object} options uni.request 标准参数
 * @returns {Promise}
 */
export function request(options = {}) {
  const finalOptions = applyRequestInterceptor({
    timeout: TIMEOUT,
    method: 'GET',
    ...options,
    url:
      options.url && options.url.startsWith('http')
        ? options.url
        : `${BASE_URL}${options.url || ''}`
  })

  return new Promise((resolve, reject) => {
    uni.request({
      ...finalOptions,
      success: (res) => {
        try {
          resolve(applyResponseInterceptor(res))
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject({ code: -1, message: '网络连接失败', raw: err })
      }
    })
  })
}

/** 语法糖 */
export const http = {
  get: (url, data, opts = {}) => request({ url, data, method: 'GET', ...opts }),
  post: (url, data, opts = {}) => request({ url, data, method: 'POST', ...opts }),
  put: (url, data, opts = {}) => request({ url, data, method: 'PUT', ...opts }),
  del: (url, data, opts = {}) =>
    request({ url, data, method: 'DELETE', ...opts })
}

export default request
