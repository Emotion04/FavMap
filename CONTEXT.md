# FavMap 领域文档

## 核心概念

### 收藏地点 (Favorite Place)

用户收藏的地理位置，包含以下属性：
- **名称**: 地点的名称
- **地址**: 地点的详细地址
- **坐标**: 经纬度坐标
- **评分**: 地点的评分（可选）
- **备注**: 用户添加的备注
- **标签**: 用户添加的标签
- **图标**: 自定义 emoji 图标
- **地铁站**: 附近地铁站信息

### 地铁站 (Subway Station)

附近的地铁站信息：
- **名称**: 地铁站名称
- **距离**: 到地铁站的距离（米）
- **步行时间**: 预计步行时间（分钟）

### 用户设置 (User Settings)

用户个性化配置：
- **主题**: 浅色/深色/跟随系统
- **默认图标**: 新收藏的默认图标
- **地图样式**: 地图显示样式

## 业务规则

### 收藏规则

1. 每个地点只能收藏一次（基于坐标去重）
2. 收藏时自动获取附近地铁站信息
3. 默认图标为 ⭐（黄色星星）

### 搜索规则

1. 使用高德地图 API 进行地点搜索
2. 搜索结果包含名称、地址、坐标、评分
3. 支持按城市筛选

### 导航规则

1. 支持调用高德、百度、腾讯地图 App
2. 用户选择要使用的地图应用
3. 传递目的地坐标和名称

### 分享规则

1. 支持分享单个或多个地点
2. 生成文本格式的分享内容
3. 调用系统分享功能

## 数据模型

### 收藏地点

```typescript
interface FavoritePlace {
  id: string;                    // 唯一标识
  name: string;                  // 地点名称
  address: string;               // 地址
  coordinate: {
    latitude: number;            // 纬度
    longitude: number;           // 经度
  };
  rating?: number;               // 评分（可选）
  notes?: string;                // 备注（可选）
  tags?: string[];               // 标签（可选）
  icon: string;                  // emoji 图标
  subwayStations?: SubwayStation[]; // 地铁站信息
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
}
```

### 地铁站

```typescript
interface SubwayStation {
  name: string;                  // 地铁站名称
  distance: number;              // 距离（米）
  walkingTime: number;           // 步行时间（分钟）
}
```

### 用户设置

```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'system'; // 主题
  defaultIcon: string;           // 默认图标
  mapStyle: string;              // 地图样式
}
```

## 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| 收藏 | Favorite | 用户保存的地点 |
| 地标 | Landmark | 地图上的标记点 |
| 地铁站 | Subway Station | 地铁站点 |
| 液态玻璃 | Liquid Glass | UI 设计风格，带有模糊效果 |
| 毛玻璃 | Frosted Glass | 半透明模糊效果 |
| POI | Point of Interest | 兴趣点 |
| 坐标 | Coordinate | 经纬度位置 |

## 集成服务

### 高德地图 API

- **POI 搜索**: 搜索地点
- **POI 详情**: 获取地点详细信息
- **周边搜索**: 查找附近设施
- **路线规划**: 计算距离和时间
- **地理编码**: 地址转坐标
- **逆地理编码**: 坐标转地址

### 系统服务

- **定位服务**: 获取用户位置
- **分享服务**: 调用系统分享功能
- **存储服务**: 本地数据存储
