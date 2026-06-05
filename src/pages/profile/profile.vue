<template>
  <view class="page">
    <!-- 顶部头像区 -->
    <view class="profile">
      <view class="profile__avatar">
        <text class="profile__avatar-text">{{ avatarInitial }}</text>
        <view class="profile__avatar-ring"></view>
      </view>
      <view class="profile__info">
        <text class="profile__hello">你 好，</text>
        <text class="profile__name">{{ userName }}</text>
        <view class="profile__tag">
          <text class="profile__tag-dot"></text>
          <text class="profile__tag-text">已和 W2E 一起吃过 {{ totalCount }} 顿</text>
        </view>
      </view>
    </view>

    <!-- 数据卡（编辑级三联） -->
    <view class="stats">
      <view class="stat">
        <text class="stat__num">{{ stats.weekly }}</text>
        <text class="stat__label">本周推荐</text>
      </view>
      <view class="stat">
        <text class="stat__num stat__num--accent">¥{{ stats.budget }}</text>
        <text class="stat__label">日均预算</text>
      </view>
      <view class="stat">
        <text class="stat__num">{{ stats.distance }}</text>
        <text class="stat__label">最爱距离 (m)</text>
      </view>
    </view>

    <!-- 设置组 -->
    <view class="section">
      <view class="section__head">
        <text class="section__eyebrow">个 性 偏 好</text>
        <text class="section__line"></text>
      </view>

      <view class="cell" @tap="openPreference">
        <view class="cell__left">
          <view class="cell__icon">🌶</view>
          <view class="cell__main">
            <text class="cell__title">饮食偏好</text>
            <text class="cell__desc">{{ tasteSummary || '辣度 / 菜系 / 忌口 — 一键定制' }}</text>
          </view>
        </view>
        <text class="cell__arrow">→</text>
      </view>

      <view class="cell" @tap="openPreference">
        <view class="cell__left">
          <view class="cell__icon">¥</view>
          <view class="cell__main">
            <text class="cell__title">预算设置</text>
            <text class="cell__desc">{{ '¥' + pref.budget + ' / 餐' }}</text>
          </view>
        </view>
        <text class="cell__arrow">→</text>
      </view>

      <view class="cell" @tap="openPreference">
        <view class="cell__left">
          <view class="cell__icon">⌀</view>
          <view class="cell__main">
            <text class="cell__title">忌口与过敏</text>
            <text class="cell__desc">{{ avoidSummary || '无' }}</text>
          </view>
        </view>
        <text class="cell__arrow">→</text>
      </view>
    </view>

    <view class="section">
      <view class="section__head">
        <text class="section__eyebrow">关 于</text>
        <text class="section__line"></text>
      </view>

      <view class="cell" @tap="onTap('about')">
        <view class="cell__left">
          <view class="cell__icon">i</view>
          <view class="cell__main">
            <text class="cell__title">关于 What2Eat</text>
            <text class="cell__desc">v1.0.0 · 编辑级日常美食推荐</text>
          </view>
        </view>
        <text class="cell__arrow">→</text>
      </view>

      <view class="cell" @tap="onTap('feedback')">
        <view class="cell__left">
          <view class="cell__icon">✎</view>
          <view class="cell__main">
            <text class="cell__title">意见反馈</text>
            <text class="cell__desc">告诉我们你想要什么</text>
          </view>
        </view>
        <text class="cell__arrow">→</text>
      </view>
    </view>

    <view class="signature">— W2E ©{{ year }} · 用 心 制 作 🍊 —</view>

    <!-- ============ 偏好设置 Popup ============ -->
    <view v-if="popupOpen" class="popup" @tap.self="closePopup">
      <view class="popup__sheet" :class="{ 'popup__sheet--in': popupOpen }">
        <view class="popup__head">
          <view>
            <text class="popup__eyebrow">偏 好 设 置</text>
            <text class="popup__title">饮食偏好</text>
          </view>
          <view class="popup__close" @tap="closePopup">×</view>
        </view>

        <scroll-view class="popup__body" scroll-y>
          <!-- 辣度 -->
          <view class="field">
            <view class="field__head">
              <text class="field__label">辣度偏好</text>
              <text class="field__value">{{ ['不能吃辣','微辣','中辣','重辣','嗜辣'][pref.spice_level - 1] || '微辣' }}</text>
            </view>
            <slider
              :min="1" :max="5" :step="1" :value="pref.spice_level"
              show-value
              activeColor="#ff6b35"
              backgroundColor="#ececec"
              block-color="#ff6b35"
              :block-size="20"
              @change="(e) => pref.spice_level = e.detail.value"
            />
          </view>

          <!-- 过敏原 -->
          <view class="field">
            <text class="field__label">过敏原</text>
            <view class="chips">
              <view
                v-for="t in ALLERGY_OPTIONS" :key="t"
                class="chip"
                :class="{ 'chip--on': pref.allergies.includes(t) }"
                @tap="toggle('allergies', t)"
              >{{ t }}</view>
            </view>
          </view>

          <!-- 忌口 -->
          <view class="field">
            <text class="field__label">忌口</text>
            <view class="chips">
              <view
                v-for="t in DISLIKE_OPTIONS" :key="t"
                class="chip"
                :class="{ 'chip--on': pref.disliked_foods.includes(t) }"
                @tap="toggle('disliked_foods', t)"
              >{{ t }}</view>
            </view>
          </view>

          <!-- 偏好菜系 -->
          <view class="field">
            <text class="field__label">偏好菜系</text>
            <view class="chips">
              <view
                v-for="t in CUISINE_OPTIONS" :key="t"
                class="chip chip--accent"
                :class="{ 'chip--on': pref.favorite_cuisines.includes(t) }"
                @tap="toggle('favorite_cuisines', t)"
              >{{ t }}</view>
            </view>
          </view>

          <!-- 预算 -->
          <view class="field">
            <view class="field__head">
              <text class="field__label">单餐预算</text>
              <text class="field__value">¥{{ pref.budget }}</text>
            </view>
            <slider
              :min="20" :max="30" :step="1" :value="pref.budget"
              activeColor="#ff6b35"
              backgroundColor="#ececec"
              block-color="#ff6b35"
              :block-size="20"
              @change="(e) => pref.budget = e.detail.value"
            />
          </view>
        </scroll-view>

        <view class="popup__footer w2e-safe-bottom">
          <view class="popup__btn popup__btn--ghost" @tap="closePopup">取消</view>
          <view
            class="popup__btn popup__btn--primary"
            :class="{ 'popup__btn--loading': saving }"
            @tap="onSave"
          >
            <text>{{ saving ? '保存中…' : '保存偏好' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useRecommendStore } from '@/stores/recommend'

const userStore = useUserStore()
const recommendStore = useRecommendStore()

const userName = computed(() => userStore.profile?.nickname || '美食探索者')
const avatarInitial = computed(() => (userName.value || 'W')[0])

const PREF_STORAGE_KEY = 'w2e_preference'
const ALLERGY_OPTIONS = ['海鲜', '花生', '乳制品', '鸡蛋', '坚果', '小麦']
const DISLIKE_OPTIONS = ['香菜', '洋葱', '内脏', '苦瓜', '榴莲', '芹菜']
const CUISINE_OPTIONS = ['川菜', '粤菜', '日料', '西餐', '轻食', '韩餐', '东南亚']

const pref = reactive({
  spice_level: 2,
  allergies: [],
  disliked_foods: [],
  favorite_cuisines: [],
  budget: 25
})

// 从本地缓存恢复
function restorePref() {
  try {
    const cached = uni.getStorageSync(PREF_STORAGE_KEY)
    if (cached && typeof cached === 'object') {
      Object.assign(pref, {
        spice_level: cached.spice_level ?? 2,
        allergies: Array.isArray(cached.allergies) ? cached.allergies : [],
        disliked_foods: Array.isArray(cached.disliked_foods) ? cached.disliked_foods : [],
        favorite_cuisines: Array.isArray(cached.favorite_cuisines) ? cached.favorite_cuisines : [],
        budget: cached.budget ?? 25
      })
    }
  } catch (e) {}
}
restorePref()

// 统计：基于历史
const totalCount = computed(() => recommendStore.historyTotal || recommendStore.history.length || 0)

const stats = computed(() => {
  const list = recommendStore.history || []
  // 本周推荐（最近 7 天）
  const now = Date.now()
  const weekly = list.filter((it) => {
    const t = new Date(it.created_at || it.date || 0).getTime()
    return now - t < 7 * 24 * 3600 * 1000
  }).length
  // 日均预算（取均值）
  const prices = list.map((it) => Number(it.price)).filter((n) => !isNaN(n))
  const budget = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : pref.budget
  // 最爱距离（中位数）
  const distances = list.map((it) => Number(it.distance)).filter((n) => !isNaN(n))
  let distance = '—'
  if (distances.length) {
    distances.sort((a, b) => a - b)
    distance = distances[Math.floor(distances.length / 2)]
  }
  return {
    weekly: String(weekly).padStart(2, '0'),
    budget,
    distance
  }
})

const tasteSummary = computed(() => {
  const parts = []
  const spice = ['不能吃辣', '微辣', '中辣', '重辣', '嗜辣'][pref.spice_level - 1]
  if (spice) parts.push(spice)
  if (pref.favorite_cuisines.length) parts.push(pref.favorite_cuisines.slice(0, 3).join('/'))
  return parts.join(' · ')
})

const avoidSummary = computed(() => {
  const arr = [...pref.allergies, ...pref.disliked_foods]
  if (!arr.length) return ''
  return arr.slice(0, 4).join('、') + (arr.length > 4 ? '…' : '')
})

const popupOpen = ref(false)
const saving = ref(false)

function openPreference() {
  popupOpen.value = true
}
function closePopup() {
  if (saving.value) return
  popupOpen.value = false
}
function toggle(key, value) {
  const list = pref[key]
  const i = list.indexOf(value)
  if (i >= 0) list.splice(i, 1)
  else list.push(value)
}

async function onSave() {
  if (saving.value) return
  saving.value = true
  try {
    await recommendStore.savePreference({ ...pref })
    try { uni.setStorageSync(PREF_STORAGE_KEY, { ...pref }) } catch (e) {}
    uni.showToast({ title: '已保存', icon: 'success' })
    popupOpen.value = false
  } catch (e) {
    if (e && e.code !== 401) {
      uni.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  } finally {
    saving.value = false
  }
}

const year = new Date().getFullYear()

function onTap(key) {
  uni.showToast({ title: `「${key}」即将开放`, icon: 'none' })
}

// 进入页面时拉一下历史以更新统计
onMounted(() => {
  if (!recommendStore.history.length) {
    recommendStore.fetchHistory(1).catch(() => {})
  }
})
onShow(() => {
  if (!recommendStore.history.length) {
    recommendStore.fetchHistory(1).catch(() => {})
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 32rpx 32rpx 80rpx;
}

/* ---------- 顶部头像 ---------- */
.profile {
  display: flex;
  align-items: center;
  padding: 56rpx 24rpx 48rpx;
  gap: 32rpx;
  animation: w2e-fade-up 0.6s ease both;
}
.profile__avatar {
  position: relative;
  width: 144rpx;
  height: 144rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff8f5e 0%, #ff6b35 60%, #e85a25 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 40rpx -16rpx rgba(255, 107, 53, 0.5);
}
.profile__avatar-text {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 72rpx;
  color: #ffffff;
  font-weight: 700;
}
.profile__avatar-ring {
  position: absolute;
  inset: -12rpx;
  border-radius: 50%;
  border: 1rpx dashed rgba(255, 107, 53, 0.4);
  animation: orbit-spin 24s linear infinite;
}
@keyframes orbit-spin {
  to { transform: rotate(360deg); }
}
.profile__info { flex: 1; }
.profile__hello {
  font-size: 22rpx;
  letter-spacing: 0.4em;
  color: #9a9a9a;
}
.profile__name {
  display: block;
  margin-top: 8rpx;
  font-size: 48rpx;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}
.profile__tag {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
}
.profile__tag-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #ff6b35;
}
.profile__tag-text {
  font-size: 22rpx;
  color: #6b6b6b;
}

/* ---------- 数据卡 ---------- */
.stats {
  display: flex;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 36rpx 0;
  box-shadow: 0 12rpx 32rpx -12rpx rgba(20, 20, 20, 0.06);
  animation: w2e-fade-up 0.7s 0.05s ease both;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  position: relative;
}
.stat + .stat::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12rpx;
  bottom: 12rpx;
  width: 1rpx;
  background: #ececec;
}
.stat__num {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 56rpx;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}
.stat__num--accent { color: #ff6b35; }
.stat__label {
  font-size: 22rpx;
  letter-spacing: 0.2em;
  color: #9a9a9a;
}

/* ---------- Section ---------- */
.section { margin-top: 56rpx; }
.section__head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  padding: 0 8rpx;
}
.section__eyebrow {
  font-size: 20rpx;
  letter-spacing: 0.4em;
  color: #ff6b35;
  font-weight: 600;
}
.section__line {
  flex: 1;
  height: 1rpx;
  background: #ececec;
  margin-left: 16rpx;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx;
  background: #ffffff;
  border-radius: 24rpx;
  margin-top: 16rpx;
  transition: transform 0.2s ease;
}
.cell:active { transform: scale(0.985); }
.cell__left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  flex: 1;
}
.cell__icon {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: #fff3ee;
  color: #ff6b35;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell__main {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.cell__title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}
.cell__desc {
  font-size: 22rpx;
  color: #9a9a9a;
  letter-spacing: 0.02em;
  max-width: 420rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.cell__arrow {
  font-size: 28rpx;
  color: #cfcfcf;
}

.signature {
  margin-top: 96rpx;
  text-align: center;
  font-size: 18rpx;
  letter-spacing: 0.4em;
  color: #c9c9c9;
}

/* ---------- Popup ---------- */
.popup {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 20, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 999;
  animation: popup-fade 0.25s ease both;
}
@keyframes popup-fade {
  from { background: rgba(20, 20, 20, 0); }
  to { background: rgba(20, 20, 20, 0.45); }
}
.popup__sheet {
  width: 100%;
  max-height: 86vh;
  background: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.32s cubic-bezier(0.22, 0.78, 0.32, 1);
}
.popup__sheet--in { transform: translateY(0); }
.popup__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 40rpx 40rpx 24rpx;
  border-bottom: 1rpx solid #ececec;
}
.popup__eyebrow {
  display: block;
  font-size: 20rpx;
  letter-spacing: 0.4em;
  color: #ff6b35;
  font-weight: 600;
}
.popup__title {
  display: block;
  margin-top: 8rpx;
  font-size: 44rpx;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}
.popup__close {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #6b6b6b;
}
.popup__body {
  flex: 1;
  padding: 24rpx 40rpx;
  max-height: 60vh;
}
.field {
  padding: 24rpx 0;
  border-bottom: 1rpx dashed #ececec;
}
.field:last-child { border-bottom: none; }
.field__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12rpx;
}
.field__label {
  font-size: 28rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.05em;
}
.field__value {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 32rpx;
  color: #ff6b35;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}
.chip {
  padding: 14rpx 26rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  background: #f8f9fa;
  color: #6b6b6b;
  border: 1rpx solid transparent;
  transition: all 0.2s ease;
}
.chip--accent { background: #ffffff; border: 1rpx solid #ececec; }
.chip--on {
  background: #1a1a1a;
  color: #ffffff;
  border-color: #1a1a1a;
}
.chip--accent.chip--on {
  background: #ff6b35;
  color: #ffffff;
  border-color: #ff6b35;
}
.popup__footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 40rpx 32rpx;
  border-top: 1rpx solid #ececec;
}
.popup__btn {
  flex: 1;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: transform 0.2s ease;
}
.popup__btn:active { transform: scale(0.97); }
.popup__btn--ghost {
  background: #ffffff;
  border: 1rpx solid #1a1a1a;
  color: #1a1a1a;
  flex: 0.7;
}
.popup__btn--primary {
  background: linear-gradient(135deg, #ff8f5e 0%, #ff6b35 60%, #e85a25 100%);
  color: #ffffff;
  box-shadow: 0 16rpx 32rpx -12rpx rgba(255, 107, 53, 0.55);
}
.popup__btn--loading { opacity: 0.7; }
</style>
