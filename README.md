# FavMap - 收藏地图应用

一个跨平台的收藏地图应用，让用户可以收藏喜欢的地点、查看相对位置、一键导航，并支持社交分享。

## 功能特性

### MVP 功能

- 🗺️ **地图浏览和搜索** - 使用高德地图 SDK，支持地点搜索
- ⭐ **收藏地点管理** - 收藏喜欢的地点，添加备注和标签
- 📤 **社交分享** - 分享收藏到微信、QQ 等社交平台
- 🌙 **深色模式** - 支持浅色/深色/跟随系统主题
- 📍 **地铁站信息** - 显示最近 3 个地铁站及距离
- 🏙️ **城市分区** - 查看城市分区信息
- 📍 **定位功能** - 显示用户当前位置，一键回到当前位置
- ✏️ **编辑收藏** - 修改收藏的名称、地址、备注、标签、图标
- 📥 **批量导入** - 支持按名称或 JSON 格式批量导入地点

### 后期功能

- 📁 **分类和文件夹** - 按类别分组收藏
- ☁️ **云端同步** - 多设备数据同步
- 👥 **应用内社交** - 与朋友分享收藏

## 技术栈

- **框架**: React Native + Expo
- **语言**: TypeScript
- **状态管理**: useState + Context
- **本地存储**: AsyncStorage
- **地图服务**: 高德原生 SDK (移动端) + 高德 JS API v2.0 (Web)
- **导航**: React Navigation
- **UI 组件**: 自定义组件（液态玻璃效果）

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Expo CLI

### 安装

```bash
# 克隆项目
git clone https://github.com/Emotion04/FavMap.git
cd FavMap

# 安装依赖
npm install

# 启动开发服务器
npx expo start
```

### 配置

Web 版需要配置三种高德凭证（移动端仅需 Web 服务 Key）：

1. **高德地图 API Key**
   - 访问 [高德开放平台控制台](https://console.amap.com/)
   - 创建应用，申请以下两种 Key：

   | 凭证 | 平台类型 | 用途 |
   |------|----------|------|
   | Key | **Web端(JS API)** | 地图渲染（瓦片、交互） |
   | 安全密钥 | 与 JS API Key 配套 | JS API v2.0 鉴权 |
   | Key | **Web服务** | REST API（地点搜索、地理编码） |

   > 自 2021 年 12 月起，JS API v2.0 强制要求安全密钥。详见 [高德安全策略](https://lbs.amap.com/api/javascript-api-v2/guide/abc/security)。

2. 在应用的"设置"页面中分别填入对应的 Key 和安全密钥

### 平台支持

| 功能 | Web | iOS | Android |
|------|-----|-----|---------|
| 地图显示 | ✅ (3D) | ✅ | ✅ |
| 地点搜索 | ✅ | ✅ | ✅ |
| 收藏管理 | ✅ | ✅ | ✅ |
| 定位功能 | ❌ | ✅ | ✅ |
| 深色模式 | ✅ | ✅ | ✅ |
| 社交分享 | ❌ | ✅ | ✅ |

> Web 版地图使用高德 JS API v2.0 (WebGL 3D)，需要配置 JS API Key + 安全密钥。搜索使用 Web 服务 Key。

## 项目结构

```
FavMap/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── GlassCard.tsx    # 液态玻璃卡片
│   │   ├── MapMarker.tsx    # 地图标记
│   │   ├── SearchBar.tsx    # 搜索栏
│   │   └── WebMap.tsx       # Web 地图组件（高德 JS API v2.0）
│   ├── screens/             # 页面
│   │   ├── MapScreen.tsx    # 地图主页面
│   │   ├── SearchScreen.tsx # 搜索页面
│   │   ├── DetailScreen.tsx # 地点详情
│   │   ├── EditScreen.tsx   # 编辑收藏
│   │   ├── ImportScreen.tsx # 批量导入
│   │   └── SettingsScreen.tsx # 设置页面
│   ├── contexts/            # Context 状态管理
│   │   ├── FavoritesContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/            # 服务层
│   │   ├── amap.ts          # 高德 API
│   │   ├── storage.ts       # 本地存储
│   │   └── share.ts         # 分享功能
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   └── utils/               # 工具函数
│       ├── constants.ts
│       └── helpers.ts
├── assets/                  # 静态资源
├── app.json                 # Expo 配置
├── package.json
└── tsconfig.json
```

## 开发计划

### 第一阶段：项目初始化 ✅
- [x] 初始化 Expo 项目
- [x] 配置 TypeScript
- [x] 安装依赖
- [x] 设置项目结构

### 第二阶段：核心功能 ✅
- [x] 实现地图显示
- [x] 实现地点搜索
- [x] 实现收藏功能
- [x] 实现地点详情页
- [x] 实现编辑收藏功能

### 第三阶段：UI 完善 ✅
- [x] 实现液态玻璃效果组件
- [x] 实现底部标签栏
- [x] 实现深色模式
- [ ] 实现启动画面

### 第四阶段：特色功能 ✅
- [x] 实现地铁站信息显示
- [x] 实现批量导入功能
- [x] 实现城市分区查看
- [x] 实现社交分享
- [x] 实现定位功能

### 第五阶段：测试和优化
- [ ] 性能优化
- [ ] Bug 修复
- [ ] 打包部署

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
