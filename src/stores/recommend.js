/**
 * 推荐相关 Pinia Store
 *  - todayResult：今日推荐缓存（用于 result 页面读取）
 *  - weekPlan：周计划
 *  - history / historyTotal / historyPage：历史列表分页
 *  - loading：通用加载态
 *
 *  对外 actions：
 *   fetchTodayRecommend(lat, lng)
 *   fetchWeekPlan(lat, lng)
 *   fetchHistory(page, size, append)
 *   savePreference(payload)
 */

import { defineStore } from 'pinia'
import { http } from '@/utils/request'

export const useRecommendStore = defineStore('recommend', {
  state: () => ({
    todayResult: null,
    weekPlan: [],
    history: [],
    historyTotal: 0,
    historyPage: 1,
    historySize: 10,
    historyLoading: false,
    historyFinished: false,
    loading: false,
    lastLocation: null
  }),

  getters: {
    hasMoreHistory: (s) => !s.historyFinished && s.history.length < s.historyTotal
  },

  actions: {
    setLocation(loc) {
      if (loc && typeof loc.latitude === 'number') {
        this.lastLocation = { latitude: loc.latitude, longitude: loc.longitude }
      }
    },

    async fetchTodayRecommend(latitude, longitude) {
      this.loading = true
      try {
        const data = await http.post('/recommend/today', { latitude, longitude })
        this.todayResult = data
        return data
      } finally {
        this.loading = false
      }
    },

    async fetchWeekPlan(latitude, longitude) {
      const data = await http.get('/recommend/week', { latitude, longitude })
      this.weekPlan = Array.isArray(data) ? data : []
      return this.weekPlan
    },

    /**
     * 历史拉取
     * @param {number} page 页码，默认 1（=1 时会重置列表）
     * @param {number} size 每页大小
     */
    async fetchHistory(page = 1, size = this.historySize) {
      if (this.historyLoading) return
      this.historyLoading = true
      try {
        const data = await http.get('/recommend/history', { page, size })
        const list = Array.isArray(data?.list) ? data.list : []
        const total = Number(data?.total || 0)
        if (page <= 1) {
          this.history = list
        } else {
          this.history = this.history.concat(list)
        }
        this.historyTotal = total
        this.historyPage = page
        this.historySize = size
        this.historyFinished = this.history.length >= total || list.length === 0
        return data
      } finally {
        this.historyLoading = false
      }
    },

    async loadMoreHistory() {
      if (this.historyFinished || this.historyLoading) return
      return this.fetchHistory(this.historyPage + 1, this.historySize)
    },

    async savePreference(payload) {
      return http.post('/user/preference', payload)
    },

    setTodayResult(result) {
      this.todayResult = result || null
    },

    reset() {
      this.todayResult = null
      this.weekPlan = []
      this.history = []
      this.historyTotal = 0
      this.historyPage = 1
      this.historyFinished = false
    }
  }
})

export default useRecommendStore
