/**
 * 定位工具
 *  - getLocation()：获取当前经纬度（自动处理授权拒绝）
 *  - openSetting()：唤起授权设置页
 */

const LOCATION_SCOPE = 'scope.userLocation'

/** 检查并请求授权 */
function ensureAuth() {
  return new Promise((resolve, reject) => {
    uni.getSetting({
      success: (res) => {
        const authorized = res.authSetting && res.authSetting[LOCATION_SCOPE]
        // 已授权
        if (authorized === true) return resolve(true)
        // 已明确拒绝过
        if (authorized === false) {
          uni.showModal({
            title: '需要位置权限',
            content: '为你推荐 1km 内最佳美食需要使用你的位置信息，是否前往设置？',
            confirmText: '去设置',
            success: (m) => {
              if (m.confirm) {
                uni.openSetting({
                  success: (s) => {
                    if (s.authSetting && s.authSetting[LOCATION_SCOPE]) resolve(true)
                    else reject({ code: 'AUTH_DENIED', message: '用户未授权定位' })
                  },
                  fail: () => reject({ code: 'AUTH_DENIED', message: '打开设置失败' })
                })
              } else {
                reject({ code: 'AUTH_CANCELED', message: '用户取消授权' })
              }
            }
          })
          return
        }
        // 从未询问 — 直接调用 getLocation 时会自动弹授权
        resolve(true)
      },
      fail: () => resolve(true) // H5 / App 平台无 getSetting，直接放行
    })
  })
}

/**
 * 获取当前经纬度
 * @param {Object} options
 *   - type: 'wgs84' | 'gcj02'，默认 'gcj02'
 *   - silent: 静默模式，授权失败不弹窗
 * @returns {Promise<{ latitude:number, longitude:number, accuracy:number }>}
 */
export function getLocation(options = {}) {
  const { type = 'gcj02', silent = false } = options
  return ensureAuth()
    .then(
      () =>
        new Promise((resolve, reject) => {
          uni.getLocation({
            type,
            isHighAccuracy: true,
            success: (res) => {
              resolve({
                latitude: res.latitude,
                longitude: res.longitude,
                accuracy: res.accuracy
              })
            },
            fail: (err) => {
              if (!silent) {
                uni.showToast({ title: '定位失败', icon: 'none' })
              }
              reject({ code: 'LOCATE_FAIL', message: '定位失败', raw: err })
            }
          })
        })
    )
    .catch((e) => {
      if (!silent && e && e.message) {
        uni.showToast({ title: e.message, icon: 'none' })
      }
      return Promise.reject(e)
    })
}

/** 打开系统设置页 */
export function openSetting() {
  return new Promise((resolve, reject) => {
    uni.openSetting({ success: resolve, fail: reject })
  })
}

/**
 * 计算两点间距离（米），Haversine 公式
 */
export function distanceBetween(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export default { getLocation, openSetting, distanceBetween }
