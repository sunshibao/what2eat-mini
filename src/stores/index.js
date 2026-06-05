/**
 * Pinia store 入口
 * 通过 main.js 中 createPinia() 创建实例后，按需在组件中导入对应 store。
 */

import { createPinia } from 'pinia'

export const pinia = createPinia()

export { useUserStore } from './user'
export { useRecommendStore } from './recommend'

export default pinia
