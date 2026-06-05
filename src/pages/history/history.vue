<template>
  <view class="page">
    <!-- 编辑级页头 -->
    <view class="head">
      <view class="head__main">
        <text class="head__eyebrow">YOUR EATING DIARY</text>
        <view class="head__title-row">
          <text class="head__title">推荐</text>
          <text class="head__title head__title--italic">记录</text>
        </view>
      </view>
      <view class="head__count">
        <text class="head__count-num">{{ String(historyTotal).padStart(2, '0') }}</text>
        <text class="head__count-unit">RECORDS</text>
      </view>
    </view>

    <!-- 月份分隔 -->
    <view v-if="records.length" class="month">
      <text class="month__line"></text>
      <text class="month__text">{{ currentMonthLabel }}</text>
      <text class="month__line"></text>
    </view>

    <!-- 列表 -->
    <view v-if="records.length" class="list">
      <view
        v-for="(item, i) in records"
        :key="item.id || i"
        class="entry"
        @tap="onTapEntry(item)"
      >
        <view class="entry__day">
          <text class="entry__day-num">{{ formatDay(item) }}</text>
          <text class="entry__day-week">{{ formatWeek(item) }}</text>
        </view>
        <view class="entry__bar">
          <view class="entry__dot"></view>
          <view class="entry__line"></view>
        </view>
        <view class="entry__body">
          <text class="entry__brand">{{ item.restaurant_name || '—' }}</text>
          <text class="entry__dish">{{ item.dish_name || '—' }}</text>
          <view class="entry__meta">
            <text class="entry__price">¥{{ item.price ?? '—' }}</text>
            <text class="entry__sep">·</text>
            <text class="entry__time">{{ formatDistance(item.distance) }}</text>
          </view>
        </view>
      </view>

      <!-- 底部加载状态 -->
      <view class="footer">
        <text v-if="loading">加载中…</text>
        <text v-else-if="!hasMore">— 已经到底啦 —</text>
        <text v-else @tap="loadMore">点击加载更多</text>
      </view>
    </view>

    <!-- 加载中骨架（首屏） -->
    <view v-else-if="loading" class="skeleton">
      <view v-for="n in 3" :key="n" class="skeleton__row">
        <view class="skeleton__day"></view>
        <view class="skeleton__bar"></view>
        <view class="skeleton__body">
          <view class="skeleton__line skeleton__line--s"></view>
          <view class="skeleton__line skeleton__line--m"></view>
          <view class="skeleton__line skeleton__line--xs"></view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty">
      <view class="empty__art">
        <view class="empty__circle"></view>
        <view class="empty__circle empty__circle--inner"></view>
        <text class="empty__emoji">🍽</text>
      </view>
      <text class="empty__title">还没有推荐记录哦</text>
      <text class="empty__desc">每一次「今天吃啥」都会留下脚印。</text>
      <view class="empty__cta" @tap="goHome">
        <text>去推荐一次</text>
        <text class="empty__cta-arrow">→</text>
      </view>
    </view>

    <view v-if="records.length" class="signature">— END · W2E ©{{ year }} —</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useRecommendStore } from '@/stores/recommend'
import { storeToRefs } from 'pinia'

const recommendStore = useRecommendStore()
const { history: records, historyTotal, historyLoading: loading, historyFinished } =
  storeToRefs(recommendStore)

const hasMore = computed(() => !historyFinished.value)
const year = computed(() => new Date().getFullYear())
const currentMonthLabel = computed(() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()} / ${m}`
})

/** 第一次进入时拉取首页 */
onShow(() => {
  if (!records.value.length) {
    recommendStore.fetchHistory(1).catch(() => {})
  }
})

/** 下拉刷新 */
onPullDownRefresh(async () => {
  try {
    await recommendStore.fetchHistory(1)
  } catch (e) {}
  uni.stopPullDownRefresh()
})

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

async function loadMore() {
  if (loading.value || historyFinished.value) return
  try {
    await recommendStore.loadMoreHistory()
  } catch (e) {}
}

function formatDay(item) {
  // 从 created_at / date 字段中取日
  const raw = item.created_at || item.date || item.recommend_date
  if (!raw) return '--'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return String(raw).slice(-2)
  return String(d.getDate()).padStart(2, '0')
}

function formatWeek(item) {
  const raw = item.created_at || item.date || item.recommend_date
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return ''
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()]
}

function formatDistance(distance) {
  const d = Number(distance)
  if (!d && d !== 0) return '—'
  if (d >= 1000) return (d / 1000).toFixed(1) + 'km'
  return Math.round(d) + 'm'
}

/** 点击某条记录：写入 store 后跳到 result 复用样式 */
function onTapEntry(item) {
  // 兼容后端可能嵌套字段：item.recommendation 或 item 本身
  const detail = item.recommendation || item
  recommendStore.setTodayResult(detail)
  uni.navigateTo({ url: '/pages/result/result' })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 32rpx 48rpx 80rpx;
}

/* ---------- 页头 ---------- */
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 32rpx 0 56rpx;
  border-bottom: 1rpx solid #ececec;
}
.head__eyebrow {
  font-size: 20rpx;
  letter-spacing: 0.4em;
  color: #9a9a9a;
}
.head__title-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-top: 16rpx;
}
.head__title {
  font-size: 80rpx;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1;
}
.head__title--italic {
  font-style: italic;
  color: #ff6b35;
  font-family: 'Times New Roman', 'Songti SC', serif;
}
.head__count {
  text-align: right;
}
.head__count-num {
  display: block;
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 64rpx;
  color: #1a1a1a;
  line-height: 1;
}
.head__count-unit {
  display: block;
  font-size: 18rpx;
  letter-spacing: 0.4em;
  color: #9a9a9a;
  margin-top: 8rpx;
}

/* ---------- 月份 ---------- */
.month {
  display: flex;
  align-items: center;
  margin: 48rpx 0 32rpx;
  gap: 24rpx;
}
.month__line {
  flex: 1;
  height: 1rpx;
  background: #ececec;
}
.month__text {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 28rpx;
  color: #6b6b6b;
  letter-spacing: 0.1em;
}

/* ---------- 列表 ---------- */
.list {
  display: flex;
  flex-direction: column;
}
.entry {
  display: flex;
  align-items: stretch;
  padding: 24rpx 0;
  animation: w2e-fade-up 0.5s ease both;
  transition: opacity 0.2s ease;
}
.entry:active {
  opacity: 0.6;
}
.entry__day {
  width: 96rpx;
  flex-shrink: 0;
  text-align: center;
}
.entry__day-num {
  display: block;
  font-family: 'Times New Roman', serif;
  font-size: 48rpx;
  font-style: italic;
  color: #1a1a1a;
  line-height: 1;
}
.entry__day-week {
  display: block;
  font-size: 18rpx;
  letter-spacing: 0.3em;
  color: #9a9a9a;
  margin-top: 8rpx;
}
.entry__bar {
  width: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 16rpx;
}
.entry__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff6b35;
  margin-top: 12rpx;
}
.entry__line {
  flex: 1;
  width: 1rpx;
  background: #ececec;
  margin-top: 8rpx;
}
.entry__body {
  flex: 1;
  padding-bottom: 8rpx;
}
.entry__brand {
  font-size: 22rpx;
  letter-spacing: 0.2em;
  color: #9a9a9a;
}
.entry__dish {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-top: 6rpx;
}
.entry__meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b6b6b;
}
.entry__price {
  color: #ff6b35;
  font-weight: 600;
}
.entry__sep {
  color: #cfcfcf;
}

.footer {
  text-align: center;
  padding: 48rpx 0 24rpx;
  font-size: 22rpx;
  letter-spacing: 0.3em;
  color: #c9c9c9;
}

/* ---------- 骨架屏 ---------- */
.skeleton {
  margin-top: 48rpx;
}
.skeleton__row {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 0;
}
.skeleton__day {
  width: 96rpx;
  height: 80rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #f4f4f4, #ececec, #f4f4f4);
  background-size: 200% 100%;
  animation: skeleton-shine 1.4s linear infinite;
}
.skeleton__bar {
  width: 32rpx;
  border-radius: 4rpx;
  background: #f4f4f4;
}
.skeleton__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  justify-content: center;
}
.skeleton__line {
  height: 24rpx;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #f4f4f4, #ececec, #f4f4f4);
  background-size: 200% 100%;
  animation: skeleton-shine 1.4s linear infinite;
}
.skeleton__line--s { width: 30%; }
.skeleton__line--m { width: 70%; height: 32rpx; }
.skeleton__line--xs { width: 40%; }
@keyframes skeleton-shine {
  to { background-position: -200% 0; }
}

/* ---------- 空状态 ---------- */
.empty {
  margin-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.empty__art {
  position: relative;
  width: 320rpx;
  height: 320rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty__circle {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1rpx dashed #f4cdb8;
  animation: orbit-spin 60s linear infinite;
}
.empty__circle--inner {
  inset: 40rpx;
  border-color: #ffe0d0;
}
@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}
.empty__emoji {
  font-size: 120rpx;
  opacity: 0.85;
}
.empty__title {
  margin-top: 48rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1a1a;
}
.empty__desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #9a9a9a;
  letter-spacing: 0.05em;
}
.empty__cta {
  margin-top: 48rpx;
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 40rpx;
  border-radius: 999rpx;
  background: #1a1a1a;
  color: #ffffff;
  font-size: 26rpx;
  letter-spacing: 0.05em;
}
.empty__cta-arrow {
  font-size: 26rpx;
}

.signature {
  margin-top: 96rpx;
  text-align: center;
  font-size: 18rpx;
  letter-spacing: 0.4em;
  color: #c9c9c9;
}
</style>
