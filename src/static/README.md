# Static Assets / 静态资源占位说明

本目录下的 PNG 文件为 **占位资源**，需在交付前由设计提供正式版本。
SVG 是给设计师参考的笔触示意；微信小程序 tabBar 仅支持 PNG。

## 需要提供的资源清单

### `images/`
| 文件 | 尺寸 | 说明 |
| ---- | ---- | ---- |
| `logo.png` | 512×512 | 应用 Logo（可保留透明背景） |

### `tab/`
微信小程序 tabBar 图标，要求：
- 尺寸：**81×81 px**（建议 2x：162×162 px）
- 格式：PNG，带透明通道
- 普通态颜色：`#9A9A9A`
- 激活态颜色：`#FF6B35`
- 风格：极简线性 / 1.5pt 描边

| 文件 | 状态 | 含义 |
| ---- | ---- | ---- |
| `home.png` | 普通态 | 首页 |
| `home-active.png` | 激活态 | 首页（选中） |
| `history.png` | 普通态 | 记录 |
| `history-active.png` | 激活态 | 记录（选中） |
| `profile.png` | 普通态 | 我的 |
| `profile-active.png` | 激活态 | 我的（选中） |

> 注：本目录提供 `*.svg` 同名文件作为草样，可直接基于 SVG 在 Figma / Sketch 中导出 PNG。
