# CLAUDE.md

## 项目概述

FavMap 是一个跨平台的收藏地图应用，让用户可以收藏喜欢的地点、查看相对位置、一键导航，并支持社交分享。

## 技术栈

- **框架**: React Native + Expo
- **语言**: TypeScript
- **状态管理**: useState + Context
- **本地存储**: AsyncStorage
- **地图服务**: 高德原生 SDK
- **导航**: React Navigation

## 开发命令

```bash
# 启动开发服务器
npx expo start

# 启动 Web 版本
npx expo start --web

# 启动 iOS 版本
npx expo start --ios

# 启动 Android 版本
npx expo start --android

# 构建生产版本
npx expo build

# 运行测试
npm test
```

## 项目结构

```
src/
├── components/          # 可复用组件
├── screens/             # 页面
├── contexts/            # Context 状态管理
├── services/            # 服务层（高德 API、存储、分享）
├── types/               # TypeScript 类型定义
└── utils/               # 工具函数和常量
```

## Agent skills

### 问题追踪器

问题以 GitHub Issues 形式存在，使用 `gh` CLI 操作。详见 `docs/agents/issue-tracker.md`。

### 分类标签

使用五个标准标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### 领域文档

单上下文布局，`CONTEXT.md` 和 `docs/adr/` 在仓库根目录。详见 `docs/agents/domain.md`。
