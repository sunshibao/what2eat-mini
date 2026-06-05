<template>
  <view class="page">
    <!-- 顶部状态栏占位（自定义导航） -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部 Eyebrow / 编辑级小标记 -->
    <view class="topline">
      <view class="topline__left">
        <text class="eyebrow">第 {{ todayVol }} 期 · {{ todayLabel }}</text>
      </view>
      <view class="topline__right" @tap="goHistory">
        <text class="topline__link">推荐记录</text>
        <text class="topline__arrow">→</text>
      </view>
    </view>

    <!-- 品牌 / Hero -->
    <view class="hero">
      <text class="hero__eyebrow">每 日 美 食 手 记</text>
      <view class="hero__title-row">
        <text class="hero__title">What</text>
        <text class="hero__title hero__title--italic">2</text>
        <text class="hero__title">Eat</text>
        <text class="hero__title-dot">.</text>
      </view>
      <view class="hero__sub-row">
        <text class="hero__divider"></text>
        <text class="hero__sub">吃 啥 呢</text>
      </view>
      <text class="hero__slogan">不纠结，一键搞定今天吃啥。</text>
    </view>

    <!-- 中央巨型按钮 -->
    <view class="cta-wrap">
      <!-- 旋转的描边光环（装饰） -->
      <view class="cta-orbit"></view>
      <view class="cta-orbit cta-orbit--inner"></view>

      <view
        class="cta"
        :class="{ 'cta--pressing': pressing, 'cta--loading': loading }"
        @touchstart="onPressStart"
        @touchend="onPressEnd"
        @touchcancel="onPressEnd"
        @tap="onRecommend"
      >
        <view class="cta__inner">
          <template v-if="!loading">
            <text class="cta__hint">点 我 选 餐</text>
            <text class="cta__main">今天</text>
            <text class="cta__main">吃啥</text>
            <text class="cta__arrow">↗</text>
          </template>
          <template v-else>
            <text class="cta__hint cta__hint--loading">AI 思 考 中</text>
            <text class="cta__loading-text">{{ loadingText }}</text>
            <view class="cta__dots">
              <view class="cta__dot"></view>
              <view class="cta__dot"></view>
              <view class="cta__dot"></view>
            </view>
          </template>
        </view>
      </view>

      <!-- 装饰性侧标 -->
      <view class="cta-tag cta-tag--left">
        <text>01</text>
        <text class="cta-tag__line"></text>
        <text>一键决定</text>
      </view>
      <view class="cta-tag cta-tag--right">
        <text>02</text>
        <text class="cta-tag__line"></text>
        <text>AI 推荐</text>
      </view>
    </view>

    <!-- 底部说明 -->
    <view class="footnote">
      <view class="footnote__row">
        <text class="footnote__num">·</text>
        <text class="footnote__text">AI 为你推荐 1km 内最佳美食</text>
      </view>
      <view class="footnote__row">
        <text class="footnote__num">·</text>
        <text class="footnote__text">基于偏好 / 预算 / 心情 实时定制</text>
      </view>
    </view>

    <view class="signature">
      <text class="signature__brand">W2E ©</text>
      <text class="signature__year">{{ todayYear }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { getLocation } from '@/utils/location'
import { useRecommendStore } from '@/stores/recommend'
import { useUserStore } from '@/stores/user'

const statusBarHeight = ref(20)
const pressing = ref(false)
const loading = ref(false)
const loadingText = ref('AI 正在想…')
let loadingTimer = null

const LOADING_PHRASES = [
  'AI 正在想…',
  '翻遍周边好店…',
  '营养搭配中…',
  '就是它了！'
]

const recommendStore = useRecommendStore()
const userStore = useUserStore()

const todayLabel = computed(() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}.${day}`
})
const todayVol = computed(() => {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d - start
  return String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(3, '0')
})
const todayYear = computed(() => new Date().getFullYear())

onMounted(() => {
  try {
    const sys = uni.getSystemInfoSync()
    statusBarHeight.value = sys.statusBarHeight || 20
  } catch (e) {}
})

onBeforeUnmount(() => {
  if (loadingTimer) clearInterval(loadingTimer)
})

function onPressStart() {
  if (loading.value) return
  pressing.value = true
}
function onPressEnd() {
  pressing.value = false
}

function startLoadingCarousel() {
  let i = 0
  loadingText.value = LOADING_PHRASES[0]
  loadingTimer = setInterval(() => {
    i = (i + 1) % LOADING_PHRASES.length
    loadingText.value = LOADING_PHRASES[i]
  }, 1500)
}
function stopLoadingCarousel() {
  if (loadingTimer) {
    clearInterval(loadingTimer)
    loadingTimer = null
  }
}

async function ensureLogin() {
  if (userStore.token) return true
  try {
    await userStore.login()
    return !!userStore.token
  } catch (e) {
    return false
  }
}

async function onRecommend() {
  if (loading.value) return
  // 轻微震动反馈
  // #ifdef MP-WEIXIN
  uni.vibrateShort && uni.vibrateShort({ type: 'light' })
  // #endif

  // 1. 确保登录
  const ok = await ensureLogin()
  if (!ok) {
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
    return
  }

  // 2. 获取定位
  let loc
  try {
    loc = await getLocation({ silent: true })
    recommendStore.setLocation(loc)
  } catch (e) {
    uni.showModal({
      title: '需要定位权限',
      content: '请开启位置权限以为你推荐周边的美食。',
      confirmText: '去设置',
      success: (m) => { if (m.confirm) uni.openSetting() }
    })
    return
  }

  // 3. 进入 loading、文案轮播
  loading.value = true
  startLoadingCarousel()

  try {
    const data = await recommendStore.fetchTodayRecommend(loc.latitude, loc.longitude)
    // 小延迟让“就是它了！”能走完
    setTimeout(() => {
      loading.value = false
      stopLoadingCarousel()
      if (data) {
        uni.navigateTo({ url: '/pages/result/result' })
      }
    }, 320)
  } catch (e) {
    loading.value = false
    stopLoadingCarousel()
    if (e && e.code !== 401) {
      uni.showToast({ title: '网络开小差了', icon: 'none' })
    }
  }
}

function goHistory() {
  uni.switchTab({ url: '/pages/history/history' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #ffffff;
  position: relative;
  overflow: hidden;
  /* 极淡的纸感纹理（径向噪点） */
  background-image:
    radial-gradient(circle at 12% 8%, rgba(255, 107, 53, 0.05) 0, transparent 36%),
    radial-gradient(circle at 92% 92%, rgba(255, 107, 53, 0.04) 0, transparent 32%);
}

.status-bar {
  width: 100%;
}

/* ---------- 顶部 ---------- */
.topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 48rpx 0;
  animation: w2e-fade-up 0.7s ease both;
}
.eyebrow {
  font-size: 20rpx;
  letter-spacing: 0.4em;
  color: #9a9a9a;
}
.topline__link {
  font-size: 20rpx;
  letter-spacing: 0.3em;
  color: #1a1a1a;
}
.topline__arrow {
  margin-left: 12rpx;
  font-size: 24rpx;
  color: #1a1a1a;
}

/* ---------- Hero ---------- */
.hero {
  padding: 88rpx 48rpx 56rpx;
  animation: w2e-fade-up 0.85s 0.05s ease both;
}
.hero__eyebrow {
  font-size: 22rpx;
  letter-spacing: 0.45em;
  color: #ff6b35;
  display: block;
  margin-bottom: 32rpx;
}
.hero__title-row {
  display: flex;
  align-items: flex-end;
  gap: 4rpx;
  line-height: 0.95;
}
.hero__title {
  font-size: 124rpx;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #1a1a1a;
  font-family: 'Times New Roman', 'Songti SC', serif;
}
.hero__title--italic {
  font-style: italic;
  color: #ff6b35;
  margin: 0 -6rpx;
}
.hero__title-dot {
  font-size: 124rpx;
  font-weight: 800;
  color: #ff6b35;
  margin-left: 4rpx;
}
.hero__sub-row {
  display: flex;
  align-items: center;
  margin-top: 28rpx;
}
.hero__divider {
  width: 64rpx;
  height: 2rpx;
  background: #1a1a1a;
  display: inline-block;
  margin-right: 24rpx;
}
.hero__sub {
  font-size: 32rpx;
  letter-spacing: 0.3em;
  color: #1a1a1a;
}
.hero__slogan {
  display: block;
  margin-top: 36rpx;
  font-size: 26rpx;
  color: #6b6b6b;
  letter-spacing: 0.05em;
}

/* ---------- 中央 CTA ---------- */
.cta-wrap {
  margin-top: 24rpx;
  position: relative;
  height: 600rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: w2e-fade-up 1s 0.15s ease both;
}

.cta-orbit {
  position: absolute;
  width: 560rpx;
  height: 560rpx;
  border-radius: 50%;
  border: 1rpx dashed rgba(255, 107, 53, 0.35);
  animation: orbit-spin 30s linear infinite;
}
.cta-orbit--inner {
  width: 480rpx;
  height: 480rpx;
  border-style: solid;
  border-color: rgba(255, 107, 53, 0.08);
  animation: orbit-spin 50s linear infinite reverse;
}
@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

.cta {
  position: relative;
  width: 380rpx;
  height: 380rpx;
  border-radius: 50%;
  background: linear-gradient(140deg, #ff8f5e 0%, #ff6b35 50%, #e85a25 100%);
  box-shadow:
    0 32rpx 64rpx -16rpx rgba(255, 107, 53, 0.55),
    inset 0 -16rpx 32rpx rgba(232, 90, 37, 0.4),
    inset 0 16rpx 32rpx rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s ease;
  animation: w2e-pulse 4s ease-in-out infinite;
}
.cta::before {
  content: '';
  position: absolute;
  inset: 8rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(255, 255, 255, 0.35);
}
.cta--pressing {
  transform: scale(0.94);
  box-shadow: 0 16rpx 32rpx -8rpx rgba(255, 107, 53, 0.55);
  animation-play-state: paused;
}
.cta__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ffffff;
  text-align: center;
}
.cta__hint {
  font-size: 20rpx;
  letter-spacing: 0.5em;
  margin-bottom: 16rpx;
  opacity: 0.85;
  padding-left: 0.5em; /* 视觉补偿 letter-spacing */
}
.cta__main {
  font-size: 76rpx;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.05;
}
.cta__arrow {
  margin-top: 18rpx;
  font-size: 30rpx;
  font-weight: 600;
}

/* ---------- CTA Loading 态 ---------- */
.cta--loading {
  animation-play-state: paused;
  background: linear-gradient(140deg, #ffa074 0%, #ff7a48 50%, #e85a25 100%);
  box-shadow:
    0 0 0 2rpx rgba(255, 107, 53, 0.18),
    0 24rpx 56rpx -16rpx rgba(255, 107, 53, 0.55),
    inset 0 -16rpx 32rpx rgba(232, 90, 37, 0.4);
}
.cta--loading::after {
  content: '';
  position: absolute;
  inset: -24rpx;
  border-radius: 50%;
  border: 2rpx solid transparent;
  border-top-color: rgba(255, 107, 53, 0.7);
  border-right-color: rgba(255, 107, 53, 0.25);
  animation: cta-spin 1.1s linear infinite;
}
@keyframes cta-spin {
  to { transform: rotate(360deg); }
}
.cta__hint--loading {
  letter-spacing: 0.45em;
  opacity: 0.95;
}
.cta__loading-text {
  margin-top: 14rpx;
  font-size: 38rpx;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ffffff;
  animation: w2e-fade-up 0.4s ease both;
}
.cta__dots {
  display: flex;
  gap: 10rpx;
  margin-top: 22rpx;
}
.cta__dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  animation: cta-dot 1s ease-in-out infinite;
}
.cta__dot:nth-child(2) { animation-delay: 0.15s; }
.cta__dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes cta-dot {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-6rpx); opacity: 1; }
}

.cta-tag {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 18rpx;
  letter-spacing: 0.3em;
  color: #9a9a9a;
}
.cta-tag__line {
  width: 32rpx;
  height: 1rpx;
  background: #cfcfcf;
}
.cta-tag--left {
  left: 24rpx;
  top: 60rpx;
}
.cta-tag--right {
  right: 24rpx;
  bottom: 60rpx;
}

/* ---------- 底部说明 ---------- */
.footnote {
  margin: 16rpx 48rpx 0;
  padding-top: 32rpx;
  border-top: 1rpx solid #ececec;
  animation: w2e-fade-up 1.1s 0.25s ease both;
}
.footnote__row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.footnote__num {
  color: #ff6b35;
  font-size: 28rpx;
}
.footnote__text {
  font-size: 24rpx;
  color: #6b6b6b;
  letter-spacing: 0.05em;
}

.signature {
  display: flex;
  justify-content: space-between;
  padding: 40rpx 48rpx 56rpx;
  font-size: 18rpx;
  letter-spacing: 0.3em;
  color: #c9c9c9;
}
</style>
