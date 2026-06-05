<script>
import { useUserStore } from './stores/user'

export default {
  onLaunch: function () {
    // 1. 从本地恢复登录态
    const userStore = useUserStore()
    userStore.restore()

    // 2. 未登录 → 静默登录（微信环境才调用 uni.login）
    if (!userStore.token) {
      userStore.login().catch((e) => {
        console.warn('[What2Eat] silent login failed:', e && e.message)
      })
    }

    // 3. 预拉取系统信息（保留 safe-area 等）
    uni.getSystemInfo({
      success: (res) => {
        uni.setStorageSync('__system_info__', res)
      }
    })

    console.log('[What2Eat] App Launch')
  },
  onShow: function () {
    // 热启动时如果 token 丢失再补一次
    const userStore = useUserStore()
    if (!userStore.token) {
      userStore.login().catch(() => {})
    }
    console.log('[What2Eat] App Show')
  },
  onHide: function () {
    console.log('[What2Eat] App Hide')
  }
}
</script>

<style lang="scss">
/* ==========================================================================
   What2Eat — 全局样式
   设计语言：编辑级克制 / 大量留白 / 单一暖橙强调
   ========================================================================== */

/* ---------- 设计变量 ---------- */
page {
  --w2e-orange: #ff6b35;
  --w2e-orange-deep: #e85a25;
  --w2e-orange-soft: #fff3ee;
  --w2e-ink: #1a1a1a;
  --w2e-text: #333333;
  --w2e-text-2: #6b6b6b;
  --w2e-text-3: #9a9a9a;
  --w2e-line: #ececec;
  --w2e-bg: #ffffff;
  --w2e-bg-soft: #f8f9fa;
  --w2e-shadow-orange: 0 24rpx 48rpx -16rpx rgba(255, 107, 53, 0.45);
  --w2e-shadow-card: 0 12rpx 32rpx -8rpx rgba(20, 20, 20, 0.06);

  background: var(--w2e-bg);
  color: var(--w2e-text);
  font-family: 'PingFang SC', 'HarmonyOS Sans', 'Source Han Sans CN',
    'Hiragino Sans GB', system-ui, sans-serif;
  font-feature-settings: 'palt';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ---------- 排版重置 ---------- */
view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button::after {
  border: none;
}

/* ---------- 通用排版工具 ---------- */
.w2e-display {
  font-family: 'Times New Roman', 'Songti SC', 'Source Han Serif CN', serif;
  font-style: italic;
  letter-spacing: -0.02em;
}

.w2e-eyebrow {
  font-size: 22rpx;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--w2e-text-3);
}

.w2e-divider {
  width: 48rpx;
  height: 2rpx;
  background: var(--w2e-ink);
  display: inline-block;
}

/* ---------- 安全区 ---------- */
.w2e-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* ---------- 通用动效 ---------- */
@keyframes w2e-fade-up {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes w2e-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: var(--w2e-shadow-orange);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 28rpx 56rpx -16rpx rgba(255, 107, 53, 0.6);
  }
}
</style>
