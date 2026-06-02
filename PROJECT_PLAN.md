# FavMap - 收藏地图应用项目计划

## 项目概述

一个跨平台的收藏地图应用，让用户可以收藏喜欢的地点、查看相对位置、一键导航，并支持社交分享。

## 目标平台

- **Web**：浏览器访问
- **移动**：iOS 和 Android 原生应用
- **策略**：统一代码库（React Native + Expo）

## 核心功能

### MVP 功能（第一阶段）

1. **地图浏览和搜索**
   - 高德地图原生 SDK 集成
   - 地点搜索（POI 搜索）
   - 显示最近 3 个地铁站及距离
   - 城市分区查看

2. **收藏地点管理**
   - 收藏地点（基本信息 + 备注和标签）
   - 自定义 emoji 图标（⭐ 默认，低透明度）
   - 显示地点名称
   - 一键批量导入地点

3. **社交分享**
   - 生成分享链接/图片
   - 分享到微信、QQ 等社交平台

4. **数据管理**
   - 纯本地存储（AsyncStorage）
   - JSON 格式导出
   - 深色模式支持

### 后期功能（第二阶段）

- 分类和文件夹
- 云端同步
- 用户登录
- 应用内社交

## UI/UX 设计规范

### 设计风格

- **圆角**：所有卡片、按钮使用圆角设计
- **液态玻璃模糊特效**：卡片、搜索栏使用毛玻璃效果
- **Google 视觉标准**：遵循 Material Design 规范
- **低透明度标记**：地图标记使用低透明度避免遮挡

### 色彩方案

- **主色调**：蓝色系
- **深色模式**：支持自动切换

### 布局规范

- **底部标签页**：可拖动悬浮栏，液态玻璃效果
- **搜索交互**：底部搜索框 → 点击上升到顶部 → 半屏卡片结果
- **地图视图**：全屏地图，显示收藏点相对位置
- **详情页面**：基本信息 + 备注和标签 + 地铁站信息 + 导航按钮

### 地图标记

- **默认图标**：⭐（黄色星星）
- **可选图标**：📌（图钉）、🌱（小草）等 emoji
- **透明度**：低透明度避免遮挡地图

## 技术架构

### 技术栈

| 层级 | 技术选择 |
|------|----------|
| 框架 | React Native + Expo |
| 语言 | TypeScript |
| 状态管理 | useState + Context |
| 本地存储 | AsyncStorage |
| 地图服务 | 高德原生 SDK |
| 导航 | React Navigation |
| UI 组件 | 自定义组件（液态玻璃效果） |

### 项目结构

```
FavMap/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── GlassCard.tsx    # 液态玻璃卡片
│   │   ├── MapMarker.tsx    # 地图标记
│   │   └── SearchBar.tsx    # 搜索栏
│   ├── screens/             # 页面
│   │   ├── MapScreen.tsx    # 地图主页面
│   │   ├── SearchScreen.tsx # 搜索页面
│   │   ├── DetailScreen.tsx # 地点详情
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
│   ├── icons/
│   └── images/
├── app.json                 # Expo 配置
├── package.json
└── tsconfig.json
```

### 数据模型

```typescript
// 收藏地点
interface FavoritePlace {
  id: string;
  name: string;
  address: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  notes?: string;
  tags?: string[];
  icon: string; // emoji 图标
  subwayStations?: SubwayStation[];
  createdAt: string;
  updatedAt: string;
}

// 地铁站
interface SubwayStation {
  name: string;
  distance: number; // 米
  walkingTime: number; // 分钟
}

// 用户设置
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultIcon: string;
  mapStyle: string;
}
```

### 高德 API 集成

| 功能 | API 接口 | 说明 |
|------|----------|------|
| POI 搜索 | `AMap.Place.searchKeyword` | 关键词搜索地点 |
| POI 详情 | `AMap.Place.getDetails` | 获取地点详细信息 |
| 周边搜索 | `AMap.Place.searchNearby` | 查找最近地铁站 |
| 路线规划 | `AMap.Walking` | 计算到地铁站距离 |
| 地理编码 | `AMap.Geocoder` | 地址转坐标 |
| 逆地理编码 | `AMap.Geocoder.getAddress` | 坐标转地址 |

## 开发计划

### 第一阶段：项目初始化（1-2 天）

- [ ] 初始化 Expo 项目
- [ ] 配置 TypeScript
- [ ] 安装依赖（高德 SDK、React Navigation 等）
- [ ] 设置项目结构

### 第二阶段：核心功能（3-5 天）

- [ ] 实现地图显示
- [ ] 实现地点搜索
- [ ] 实现收藏功能
- [ ] 实现地点详情页

### 第三阶段：UI 完善（2-3 天）

- [ ] 实现液态玻璃效果组件
- [ ] 实现底部标签栏
- [ ] 实现深色模式
- [ ] 实现启动画面

### 第四阶段：特色功能（2-3 天）

- [ ] 实现地铁站信息显示
- [ ] 实现批量导入功能
- [ ] 实现城市分区查看
- [ ] 实现社交分享

### 第五阶段：测试和优化（1-2 天）

- [ ] 性能优化
- [ ] Bug 修复
- [ ] 打包部署

## 部署方案

- **开发阶段**：Expo Go 应用调试
- **测试阶段**：Expo 云构建（EAS Build）
- **发布阶段**：
  - Web：Vercel / Netlify
  - iOS：App Store
  - Android：Google Play / 国内应用市场

## 注意事项

1. **高德 API Key**：需要申请高德开放平台 API Key
2. **iOS 审核**：地图功能需要说明用途
3. **国内发布**：需要 ICP 备案（Web 端）
4. **权限申请**：定位权限、存储权限

## 参考资源

- [Expo 官方文档](https://docs.expo.dev/)
- [高德开放平台](https://lbs.amap.com/)
- [React Navigation 文档](https://reactnavigation.org/)
- [React Native 文档](https://reactnative.dev/)
