# TuneHub API 接口文档

> Version: 1.0.0  
> Base URL: `https://music-dl.sayqz.com`

## 概览

TuneHub 是一个统一的音乐信息解析服务。它打破了不同音乐平台之间的壁垒，提供了一套标准化的 API 接口。

## 支持的平台

| 平台标识 (source) | 平台名称 | 状态 |
|------------------|---------|------|
| `netease` | 网易云音乐 | ✅ 已启用 |
| `kuwo` | 酷我音乐 | ✅ 已启用 |
| `qq` | QQ音乐 | ✅ 已启用 |

---

## 核心 API

### 1. 获取歌曲基本信息

获取歌曲的名称、歌手、专辑等基本元数据信息。

**请求**
```
GET /api/?source={source}&id={id}&type=info
```

**参数说明**
- `source` - 平台标识（netease/kuwo/qq）
- `id` - 歌曲 ID
- `type` - 固定值 `info`

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "name": "歌曲名称",
    "artist": "歌手名称",
    "album": "专辑名称",
    "url": "https://music-dl.sayqz.com/api/?source=netease&id=123456&type=url",
    "pic": "https://music-dl.sayqz.com/api/?source=netease&id=123456&type=pic",
    "lrc": "https://music-dl.sayqz.com/api/?source=netease&id=123456&type=lrc"
  },
  "timestamp": "2025-11-23T12:00:00.000+08:00"
}
```

---

### 2. 获取音乐文件链接

获取歌曲的实际音乐文件下载/播放地址。

**请求**
```
GET /api/?source={source}&id={id}&type=url&br={br}
```

**参数说明**
- `source` - 平台标识（netease/kuwo/qq）
- `id` - 歌曲 ID
- `type` - 固定值 `url`
- `br` - 音质参数（可选，默认 320k）

**音质参数 (br) 对照表**

| 值 | 说明 | 比特率 |
|----|------|--------|
| `128k` | 标准音质 | 128kbps |
| `320k` | 高品质 | 320kbps |
| `flac` | 无损音质 | ~1000kbps |
| `flac24bit` | Hi-Res 音质 | ~1400kbps |

**响应说明**
- 成功时返回 `302 Redirect` 到实际的音乐文件 URL
- 自动换源：当请求的原平台失败时，系统会自动尝试其他平台。此时响应头会包含 `X-Source-Switch` 字段（例如：netease -> kuwo）

---

### 3. 获取专辑封面

获取歌曲的专辑封面图片。

**请求**
```
GET /api/?source={source}&id={id}&type=pic
```

**参数说明**
- `source` - 平台标识（netease/kuwo/qq）
- `id` - 歌曲 ID
- `type` - 固定值 `pic`

**响应**
- 返回 `302 Redirect` 到图片 URL

---

### 4. 获取歌词

获取歌曲的 LRC 格式歌词。

**请求**
```
GET /api/?source={source}&id={id}&type=lrc
```

**参数说明**
- `source` - 平台标识（netease/kuwo/qq）
- `id` - 歌曲 ID
- `type` - 固定值 `lrc`

**响应示例 (Text/Plain)**
```
[00:00.00]歌词第一行
[00:05.50]歌词第二行
[00:10.20]歌词第三行
```

---

### 5. 搜索歌曲

在指定平台搜索歌曲。

**请求**
```
GET /api/?source={source}&type=search&keyword={keyword}&limit={limit}
```

**参数说明**
- `source` - 平台标识（netease/kuwo/qq）
- `type` - 固定值 `search`
- `keyword` - 搜索关键词
- `limit` - 返回结果数量（可选，默认 20）

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "周杰伦",
    "total": 10,
    "results": [
      {
        "id": "123456",
        "name": "歌曲名称",
        "artist": "周杰伦",
        "album": "专辑名称",
        "url": "https://music-dl.sayqz.com/api/?...",
        "platform": "netease"
      }
    ]
  }
}
```

---

### 6. 聚合搜索

一次性并发请求所有启用的平台，并对结果进行智能混合排列。

**请求**
```
GET /api/?type=aggregateSearch&keyword={keyword}
```

**参数说明**
- `type` - 固定值 `aggregateSearch`
- `keyword` - 搜索关键词

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "周杰伦",
    "results": [
      {
        "id": "123456",
        "name": "歌曲名称",
        "artist": "周杰伦",
        "platform": "netease"
      },
      {
        "id": "789012",
        "name": "另一首歌",
        "artist": "周杰伦",
        "platform": "kuwo"
      }
    ]
  }
}
```

**特性**
- 并发请求，速度快
- 自动去重
- 支持统一分页

---

### 7. 获取歌单详情

获取指定歌单的详细信息。

**请求**
```
GET /api/?source={source}&id={id}&type=playlist
```

**参数说明**
- `source` - 平台标识（netease/kuwo/qq）
- `id` - 歌单 ID
- `type` - 固定值 `playlist`

**响应示例**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "123456",
        "name": "歌曲名称",
        "types": ["flac", "320k", "128k"]
      }
    ],
    "info": {
      "name": "歌单名称",
      "author": "创建者"
    }
  }
}
```

---

### 8. 获取排行榜列表

获取指定平台的所有排行榜。

**请求**
```
GET /api/?source={source}&type=toplists
```

**参数说明**
- `source` - 平台标识（netease/kuwo/qq）
- `type` - 固定值 `toplists`

**响应示例**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "19723756",
        "name": "飙升榜",
        "updateFrequency": "每天更新"
      }
    ]
  }
}
```

---

### 9. 获取排行榜歌曲

获取指定排行榜的歌曲列表。

**请求**
```
GET /api/?source={source}&id={id}&type=toplist
```

**参数说明**
- `source` - 平台标识（netease/kuwo/qq）
- `id` - 排行榜 ID
- `type` - 固定值 `toplist`

**响应示例**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "123456",
        "name": "歌曲名称"
      }
    ],
    "source": "netease"
  }
}
```

---

## 系统监控 API

### 10. 系统状态

**请求**
```
GET /status
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "status": "running",
    "platforms": {
      "netease": { "enabled": true },
      "kuwo": { "enabled": true },
      "qq": { "enabled": true }
    }
  }
}
```

---

### 11. 健康检查

**请求**
```
GET /health
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "status": "healthy"
  }
}
```

---

## 统计分析 API

所有数据均使用 **UTC+8（北京时间）** 时区。

### 12. 获取统计数据

**请求**
```
GET /stats?period={period}&groupBy={groupBy}
```

**参数说明**
- `period` - 统计周期（today/week/month，默认 today）
- `groupBy` - 分组方式（platform/type，默认 platform）

**响应示例**
```json
{
  "code": 200,
  "data": {
    "period": "today",
    "overall": {
      "total_calls": 15420,
      "success_calls": 14856,
      "success_rate": 96.34,
      "avg_duration": 245.67
    },
    "breakdown": [
      {
        "group_key": "netease",
        "total_calls": 8234,
        "success_rate": 97.13
      }
    ],
    "qps": {
      "avg_qps": 0.1785,
      "peak_qps": 2.4567
    }
  }
}
```

---

### 13. 获取统计摘要

**请求**
```
GET /stats/summary
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "today": {
      "total_calls": 15420,
      "success_rate": 96.34
    },
    "week": {
      "total_calls": 98765
    },
    "top_platforms_today": [
      { "group_key": "netease", "total_calls": 8234 }
    ]
  }
}
```

---

### 14. 平台统计概览

**请求**
```
GET /stats/platforms?period={period}
```

**参数说明**
- `period` - 统计周期（today/week/month，默认 today）

**响应示例**
```json
{
  "code": 200,
  "data": {
    "platforms": {
      "netease": {
        "total_calls": 8234,
        "success_rate": 97.13
      },
      "kuwo": {
        "total_calls": 4521,
        "success_rate": 97.08
      }
    }
  }
}
```

---

### 15. QPS 统计

**请求**
```
GET /stats/qps?period={period}
```

**参数说明**
- `period` - 统计周期（today/week/month，默认 today）

**响应示例**
```json
{
  "code": 200,
  "data": {
    "qps": {
      "avg_qps": 0.1785,
      "peak_qps": 2.4567,
      "hourly_data": [
        {
          "date": "2025-11-24",
          "hour": 14,
          "calls": 8845,
          "qps": "2.4569"
        }
      ]
    }
  }
}
```

---

### 16. 趋势数据

**请求**
```
GET /stats/trends?period={period}
```

**参数说明**
- `period` - 统计周期（week/month，默认 week）

**响应示例**
```json
{
  "code": 200,
  "data": {
    "trends": [
      {
        "date": "2025-11-17",
        "total_calls": 12345,
        "success_rate": 96.20
      },
      {
        "date": "2025-11-18",
        "total_calls": 13567,
        "success_rate": 96.48
      }
    ]
  }
}
```

---

### 17. 请求类型统计

**请求**
```
GET /stats/types?period={period}
```

**参数说明**
- `period` - 统计周期（today/week/month，默认 today）

**响应示例**
```json
{
  "code": 200,
  "data": {
    "requestTypes": {
      "url": {
        "total_calls": 6234,
        "success_rate": 96.21
      },
      "info": {
        "total_calls": 4521,
        "success_rate": 98.56
      }
    }
  }
}
```

---

## 高级特性

### 🔄 自动换源 (Auto-Switch)

当请求 `type=url` 时，如果原平台获取失败，系统会自动按配置优先级尝试其他平台。

**换源优先级**
1. kuwo (酷我音乐)
2. netease (网易云音乐)
3. qq (QQ音乐)

响应头会包含 `X-Source-Switch` 字段，显示换源信息（例如：`netease -> kuwo`）。

---

### 🔍 聚合搜索 (Aggregate Search)

使用 `aggregateSearch` 可以一次性并发请求所有启用的平台，并对结果进行智能混合排列。

**特性**
- 并发请求，速度快
- 自动去重
- 支持统一分页

---

## 实时统计

- **实时看板**: https://api.tunefree.fun/
- **今日调用量**: 289,225+
- **成功率**: 98.85%
- **平均耗时**: 350ms
- **平均 QPS**: 13.39

---

## 常见用例

### 示例 1: 搜索并播放歌曲

```javascript
// 1. 搜索歌曲
const searchUrl = 'https://music-dl.sayqz.com/api/?type=aggregateSearch&keyword=周杰伦';

// 2. 获取歌曲信息
const infoUrl = 'https://music-dl.sayqz.com/api/?source=netease&id=123456&type=info';

// 3. 获取音乐链接
const musicUrl = 'https://music-dl.sayqz.com/api/?source=netease&id=123456&type=url&br=320k';

// 4. 获取歌词
const lrcUrl = 'https://music-dl.sayqz.com/api/?source=netease&id=123456&type=lrc';
```

### 示例 2: 获取排行榜

```javascript
// 1. 获取排行榜列表
const toplistsUrl = 'https://music-dl.sayqz.com/api/?source=netease&type=toplists';

// 2. 获取排行榜歌曲
const toplistUrl = 'https://music-dl.sayqz.com/api/?source=netease&id=19723756&type=toplist';
```

---

© 2025 TuneHub API Documentation.
