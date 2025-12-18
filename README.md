# Open Music 🎵

一个现代化的在线音乐播放器，支持跨平台音乐搜索和播放。

## ✨ 特性

- 🎵 **跨平台搜索** - 聚合网易云音乐、QQ音乐、酷我音乐
- 🎨 **现代化设计** - 精美的 UI 界面，支持深色/浅色主题
- 📝 **歌词同步** - 实时滚动歌词显示
- 📑 **歌单管理** - 创建和管理自己的歌单
- 💾 **本地存储** - 所有数据保存在浏览器本地
- 📱 **响应式设计** - 完美适配手机、平板和桌面
- 🔄 **多种播放模式** - 顺序、循环、随机、单曲循环
- 🎚️ **音质选择** - 支持多种音质（128k/320k/flac）
- ❤️ **收藏功能** - 收藏你喜欢的歌曲
- 🕒 **播放历史** - 自动记录播放历史

## 🚀 快速开始

### 本地运行

1. 克隆项目
```bash
git clone https://github.com/yourusername/open-music.git
cd open-music
```

2. 使用本地服务器运行（推荐）
```bash
# 使用 Python 3
python3 -m http.server 8000

# 或使用 Node.js http-server
npx http-server -p 8000
```

3. 打开浏览器访问
```
http://localhost:8000
```

### 直接打开

也可以直接在浏览器中打开 `index.html` 文件，但某些功能可能受限。

## 📦 项目结构

```
open-music/
├── index.html          # 主页面
├── css/
│   ├── design-system.css   # 设计系统
│   ├── components.css      # 组件样式
│   └── layout.css          # 布局样式
├── js/
│   ├── api.js             # API 封装
│   ├── storage.js         # 数据存储
│   ├── player.js          # 播放器核心
│   ├── lyrics.js          # 歌词解析
│   └── app.js             # 主应用逻辑
├── TuneHub_API.md         # API 文档
└── README.md              # 项目说明
```

## 🎯 功能说明

### 搜索音乐
在顶部搜索框输入歌名或歌手名，自动搜索多个平台的音乐。

### 播放控制
- **播放/暂停**: 点击播放按钮
- **上一曲/下一曲**: 使用播放器控制按钮
- **进度条**: 点击进度条跳转到指定位置
- **音量**: 调节音量滑块

### 歌单管理
1. 点击侧边栏的"创建歌单"按钮
2. 输入歌单名称
3. 在搜索结果中点击"➕"添加歌曲到歌单
4. 点击歌单查看和播放

### 歌词显示
点击播放器右侧的"📝"按钮显示/隐藏歌词面板。歌词会自动滚动并高亮当前播放的那一行。

## 🌐 部署到 GitHub Pages

1. 创建 GitHub 仓库
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/open-music.git
git push -u origin main
```

2. 启用 GitHub Pages
   - 进入仓库的 Settings
   - 找到 Pages 选项
   - Source 选择 `main` 分支
   - 保存

3. 访问你的应用
```
https://yourusername.github.io/open-music
```

## 🔧 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **API**: TuneHub API (https://music-dl.sayqz.com)
- **存储**: IndexedDB + LocalStorage
- **字体**: Google Fonts (Inter, Poppins)

## 📋 浏览器支持

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [TuneHub API](https://music-dl.sayqz.com) - 提供音乐数据接口
- Google Fonts - 提供优质字体

---

**Enjoy your music! 🎵**
