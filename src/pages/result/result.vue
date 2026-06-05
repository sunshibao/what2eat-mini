<template>
  <view class="page">
    <!-- 顶部 Eyebrow -->
    <view class="head">
      <text class="head__eyebrow">今 日 精 选 · {{ today }}</text>
      <text class="head__no">第 {{ pickNo }} 号</text>
    </view>

    <!-- 主推荐卡片 -->
    <view v-if="hasData" class="card" :key="refreshKey">
      <view class="card__cover">
        <view class="cover__decor cover__decor--1"></view>
        <view class="cover__decor cover__decor--2"></view>
        <text class="cover__emoji">{{ emoji }}</text>
        <view v-if="data.category" class="cover__chip">{{ data.category }}</view>
      </view>

      <view class="card__body">
        <text class="card__brand">{{ data.restaurant_name }}</text>
        <view class="card__title-row">
          <text class="card__title">{{ data.dish_name }}</text>
          <text class="card__price">¥{{ data.price }}</text>
        </view>

        <view class="meta">
          <view class="meta__item">
            <text class="meta__icon">◎</text>
            <text class="meta__text">{{ distanceLabel }}</text>
          </view>
          <text class="meta__sep"></text>
          <view class="meta__item">
            <text class="meta__icon">⌖</text>
            <text class="meta__text meta__text--addr">{{ data.address || '—' }}</text>
          </view>
        </view>

        <!-- 营养标签 -->
        <view v-if="tags.length" class="tags">
          <view v-for="t in tags" :key="t" class="tag">{{ t }}</view>
        </view>
      </view>
    </view>

    <!-- 空态：未拿到推荐数据 -->
    <view v-else class="card card--empty">
      <text class="card--empty__emoji">🍊</text>
      <text class="card--empty__title">还没有推荐数据</text>
      <text class="card--empty__desc">返回首页点击“今天吃啥”试试。</text>
    </view>

    <!-- AI 推荐理由 -->
    <view v-if="hasData && data.reason" class="reason">
      <view class="reason__head">
        <text class="reason__eyebrow">推 荐 理 由 · 为什么是它</text>
        <text class="reason__line"></text>
      </view>
      <text class="reason__text">{{ data.reason }}</text>
      <view class="reason__sign">
        <text class="reason__brand">— W2E AI</text>
      </view>
    </view>

    <!-- 操作区 -->
    <view v-if="hasData" class="actions w2e-safe-bottom">
      <view
        class="actions__btn actions__btn--ghost"
        :class="{ 'actions__btn--disabled': changing }"
        @tap="onChange"
      >
        <text class="actions__icon" :class="{ 'actions__icon--spin': changing }">↻</text>
        <text>{{ changing ? '换一个中' : '换一个' }}</text>
      </view>
      <view class="actions__btn actions__btn--primary" @tap="onNavigate">
        <text>带我去</text>
        <text class="actions__icon">→</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecommendStore } from '@/stores/recommend'
import { getLocation } from '@/utils/location'

const refreshKey = ref(0)
const changing = ref(false)
const recommendStore = useRecommendStore()

const pickNo = computed(() => {
  const d = new Date()
  return String(d.getDate()).padStart(3, '0')
})

const today = computed(() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${m}.${day}`
})

const data = computed(() => recommendStore.todayResult || {})
const hasData = computed(() => !!recommendStore.todayResult)

const tags = computed(() => {
  const t = data.value.nutrition_tags
  return Array.isArray(t) ? t : []
})

/** 距离格式化 */
const distanceLabel = computed(() => {
  const d = Number(data.value.distance)
  if (!d && d !== 0) return '—'
  if (d >= 1000) return (d / 1000).toFixed(1) + 'km'
  return Math.round(d) + 'm'
})

/** 根据菜品关键字推断 emoji（后端未返回时的兼容装饰） */
const emoji = computed(() => {
  const name = (data.value.dish_name || '') + (data.value.restaurant_name || '')
  const map = [
    [/(拉面|面)/, '🍜'],
    [/(寿司|生鱼)/, '🍣'],
    [/(沉拉|salad|沙拉)/i, '🥗'],
    [/(火锅|麻辣头)/, '🍲'],
    [/(烧烤|bbq)/i, '🍖'],
    [/(咖啡|coffee)/i, '☕️'],
    [/(饭|烒|中餐)/, '🍚'],
    [/(汉堡|burger)/i, '🍔'],
    [/(披萨|pizza)/i, '🍕']
  ]
  for (const [re, e] of map) if (re.test(name)) return e
  return '🍴'
})

async function onChange() {
  if (changing.value) return
  changing.value = true
  // #ifdef MP-WEIXIN
  uni.vibrateShort && uni.vibrateShort({ type: 'light' })
  // #endif
  try {
    let loc = recommendStore.lastLocation
    if (!loc) {
      try { loc = await getLocation({ silent: true }) } catch (e) {}
    }
    if (!loc) {
      uni.showToast({ title: '定位失败', icon: 'none' })
      return
    }
    await recommendStore.fetchTodayRecommend(loc.latitude, loc.longitude)
    refreshKey.value++
  } catch (e) {
    if (e && e.code !== 401) {
      uni.showToast({ title: '网络开小差了', icon: 'none' })
    }
  } finally {
    changing.value = false
  }
}

function onNavigate() {
  const d = data.value
  if (!d || typeof d.latitude !== 'number' || typeof d.longitude !== 'number') {
    uni.showToast({ title: '缺少位置信息', icon: 'none' })
    return
  }
  uni.openLocation({
    latitude: d.latitude,
    longitude: d.longitude,
    name: d.restaurant_name || '推荐餐厅',
    address: d.address || '',
    fail: () => uni.showToast({ title: '打开地图失败', icon: 'none' })
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 24rpx 32rpx 0;
  font-family: 'PingFang SC', system-ui, sans-serif;
}

/* ---------- Head ---------- */
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 16rpx 8rpx 32rpx;
}
.head__eyebrow {
  font-size: 20rpx;
  letter-spacing: 0.4em;
  color: #9a9a9a;
}
.head__no {
  font-family: 'Times New Roman', 'Songti SC', serif;
  font-style: italic;
  font-size: 36rpx;
  color: #ff6b35;
}

/* ---------- Card ---------- */
.card {
  background: #ffffff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 40rpx -16rpx rgba(20, 20, 20, 0.08);
  animation: w2e-fade-up 0.55s ease both;
}

.card__cover {
  position: relative;
  height: 360rpx;
  background:
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 0, transparent 40%),
    linear-gradient(135deg, #ffb38c 0%, #ff6b35 60%, #e85a25 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cover__decor {
  position: absolute;
  border-radius: 50%;
  border: 1rpx dashed rgba(255, 255, 255, 0.5);
}
.cover__decor--1 {
  width: 480rpx;
  height: 480rpx;
  top: -120rpx;
  left: -80rpx;
}
.cover__decor--2 {
  width: 280rpx;
  height: 280rpx;
  bottom: -80rpx;
  right: -40rpx;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.18);
}
.cover__emoji {
  font-size: 200rpx;
  filter: drop-shadow(0 16rpx 32rpx rgba(0, 0, 0, 0.18));
  z-index: 2;
}
.cover__chip {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #e85a25;
  font-size: 22rpx;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.card__body {
  padding: 40rpx 36rpx 36rpx;
}
.card__brand {
  display: block;
  font-size: 22rpx;
  letter-spacing: 0.3em;
  color: #9a9a9a;
}
.card__title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 16rpx;
}
.card__title {
  font-size: 48rpx;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.01em;
  line-height: 1.2;
  flex: 1;
}
.card__price {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 56rpx;
  color: #ff6b35;
  margin-left: 24rpx;
}

.meta {
  display: flex;
  align-items: center;
  margin-top: 28rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #ececec;
  border-bottom: 1rpx solid #ececec;
}
.meta__item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}
.meta__icon {
  color: #ff6b35;
  font-size: 26rpx;
}
.meta__text {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}
.meta__sep {
  width: 1rpx;
  height: 24rpx;
  background: #ececec;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 28rpx;
}
.tag {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: #fff3ee;
  color: #e85a25;
  font-size: 22rpx;
  letter-spacing: 0.05em;
}

/* ---------- 空态卡片 ---------- */
.card--empty {
  padding: 96rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16rpx;
}
.card--empty__emoji {
  font-size: 96rpx;
  opacity: 0.85;
}
.card--empty__title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a1a;
}
.card--empty__desc {
  font-size: 24rpx;
  color: #9a9a9a;
  letter-spacing: 0.05em;
}

.meta__text--addr {
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 22rpx;
  color: #6b6b6b;
  font-weight: 400;
}

/* ---------- Reason ---------- */
.reason {
  margin-top: 32rpx;
  padding: 36rpx 36rpx 32rpx;
  background: #ffffff;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 32rpx -12rpx rgba(20, 20, 20, 0.05);
  animation: w2e-fade-up 0.65s 0.05s ease both;
}
.reason__head {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.reason__eyebrow {
  font-size: 20rpx;
  letter-spacing: 0.4em;
  color: #ff6b35;
  font-weight: 600;
}
.reason__line {
  flex: 1;
  height: 1rpx;
  background: #ececec;
  margin-left: 16rpx;
}
.reason__text {
  display: block;
  font-size: 28rpx;
  line-height: 1.7;
  color: #333333;
  letter-spacing: 0.02em;
}
.reason__sign {
  display: flex;
  justify-content: flex-end;
  margin-top: 20rpx;
}
.reason__brand {
  font-size: 22rpx;
  font-style: italic;
  color: #9a9a9a;
  font-family: 'Times New Roman', serif;
}

/* ---------- Actions ---------- */
.actions {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 20rpx;
  padding: 32rpx 0 32rpx;
  margin-top: 40rpx;
}
.actions__btn {
  flex: 1;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 0.05em;
  transition: transform 0.2s ease;
}
.actions__btn:active {
  transform: scale(0.97);
}
.actions__btn--ghost {
  background: #ffffff;
  border: 1rpx solid #1a1a1a;
  color: #1a1a1a;
  flex: 0.85;
}
.actions__btn--primary {
  background: linear-gradient(135deg, #ff8f5e 0%, #ff6b35 60%, #e85a25 100%);
  color: #ffffff;
  box-shadow: 0 16rpx 32rpx -12rpx rgba(255, 107, 53, 0.55);
}
.actions__btn--disabled {
  opacity: 0.55;
}
.actions__icon {
  font-size: 30rpx;
}
.actions__icon--spin {
  animation: cta-spin 0.9s linear infinite;
  display: inline-block;
}
@keyframes cta-spin {
  to { transform: rotate(360deg); }
}
</style>
