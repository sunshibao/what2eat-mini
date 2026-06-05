/**
 * 用户状态 Store
 *  - token：登录态凭证
 *  - profile：用户信息
 *  - 登录 / 登出 / 恢复
 */

import { defineStore } from 'pinia'
import { http } from '@/utils/request'

const TOKEN_KEY = 'w2e_token'
const PROFILE_KEY = 'w2e_profile'

/** 调用 uni.login 拿 code（Promise 化） */
function wxLoginCode() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        if (res && res.code) resolve(res.code)
        else reject(new Error('未取得 wx code'))
      },
      fail: (err) => reject(err)
    })
  })
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    profile: null
  }),

  getters: {
    isLogin: (state) => !!state.token,
    nickname: (state) => state.profile?.nickname || '美食探索者',
    avatar: (state) => state.profile?.avatar || ''
  },

  actions: {
    /** 启动时从本地存储恢复登录态 */
    restore() {
      try {
        const t = uni.getStorageSync(TOKEN_KEY)
        const p = uni.getStorageSync(PROFILE_KEY)
        if (t) this.token = t
        if (p) this.profile = p
      } catch (e) {
        console.warn('[user.restore] failed', e)
      }
    },

    /** 设置登录信息并持久化 */
    setLogin({ token, profile }) {
      this.token = token || ''
      this.profile = profile || null
      try {
        if (token) uni.setStorageSync(TOKEN_KEY, token)
        if (profile) uni.setStorageSync(PROFILE_KEY, profile)
      } catch (e) {}
    },

    /** 仅更新用户信息 */
    setProfile(profile) {
      this.profile = { ...(this.profile || {}), ...(profile || {}) }
      try {
        uni.setStorageSync(PROFILE_KEY, this.profile)
      } catch (e) {}
    },

    /**
     * 微信静默登录
     *  - 已登录：直接返回 token
     *  - 未登录：uni.login 拿 code → POST /wx/login → 持久化
     * @param {boolean} force 强制重新登录
     */
    async login(force = false) {
      if (this.token && !force) return this.token
      try {
        const code = await wxLoginCode()
        const data = await http.post('/wx/login', { code })
        const token = data?.token || ''
        const profile = {
          user_id: data?.user_id,
          is_new: !!data?.is_new,
          ...(this.profile || {})
        }
        this.setLogin({ token, profile })
        return token
      } catch (e) {
        console.warn('[user.login] failed', e)
        throw e
      }
    },

    /** 登出并清理 */
    logout() {
      this.token = ''
      this.profile = null
      try {
        uni.removeStorageSync(TOKEN_KEY)
        uni.removeStorageSync(PROFILE_KEY)
      } catch (e) {}
    }
  }
})
