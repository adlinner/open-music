/**
 * Open Music - Main Application
 * 主应用逻辑控制器
 */

const App = {
  currentView: 'discover',
  currentPlaylist: null,
  searchTimeout: null,
  
  /**
   * 初始化应用
   */
  async init() {
    console.log('Initializing Open Music...');
    
    // 初始化存储
    await Storage.init();
    
    // 初始化播放器
    Player.init();
    
    // 加载数据
    await this.loadPlaylists();
    await this.loadTopLists();
    
    // 绑定事件
    this.bindEvents();
    this.bindPlayerEvents();
    
    // 检查主题设置
    this.loadTheme();
    
    console.log('Open Music initialized successfully!');
  },
  
  /**
   * 绑定UI事件
   */
  bindEvents() {
    // 搜索
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      const keyword = e.target.value.trim();
      
      if (keyword.length > 0) {
        this.searchTimeout = setTimeout(() => {
          this.search(keyword);
        }, 500);
      }
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const keyword = e.target.value.trim();
        if (keyword) {
          clearTimeout(this.searchTimeout);
          this.search(keyword);
        }
      }
    });
    
    // 点击搜索框时如果有内容，自动切换到搜索视图
    searchInput.addEventListener('focus', (e) => {
      const keyword = e.target.value.trim();
      if (keyword && this.currentView !== 'search') {
        this.switchView('search');
      }
    });
    
    // 侧边栏导航
    document.querySelectorAll('.sidebar-item[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.switchView(view);
        
        // 更新激活状态
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
    
    // 创建歌单
    document.getElementById('createPlaylistBtn').addEventListener('click', () => {
      this.createPlaylist();
    });
    
    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // 移动端菜单
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('active');
    });
    
    // 收藏按钮
    document.getElementById('favoriteBtn').addEventListener('click', () => {
      this.toggleFavorite();
    });
    
    // 歌词按钮
    document.getElementById('lyricsBtn').addEventListener('click', () => {
      document.getElementById('lyricsPanel').classList.toggle('active');
    });
    
    // 播放全部
    document.getElementById('playAllBtn')?.addEventListener('click', () => {
      this.playAllSongs();
    });
    
    // 删除歌单
    document.getElementById('deletePlaylistBtn')?.addEventListener('click', () => {
      this.deleteCurrentPlaylist();
    });
  },
  
  /**
   * 绑定播放器事件
   */
  bindPlayerEvents() {
    // 播放/暂停
    document.getElementById('playBtn').addEventListener('click', () => {
      Player.toggle();
    });
    
    // 上一曲
    document.getElementById('prevBtn').addEventListener('click', () => {
      Player.previous();
    });
    
    // 下一曲
    document.getElementById('nextBtn').addEventListener('click', () => {
      Player.next();
    });
    
    // 播放模式
    document.getElementById('repeatBtn').addEventListener('click', () => {
      Player.togglePlayMode();
    });
    
    // 进度条
    const progressBar = document.getElementById('progressBar');
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const time = percent * Player.getDuration();
      Player.seek(time);
    });
    
    // 音量控制
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('click', (e) => {
      const rect = volumeSlider.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      Player.setVolume(percent);
      this.updateVolumeUI(percent);
    });
    
    document.getElementById('volumeBtn').addEventListener('click', () => {
      if (Player.volume > 0) {
        Player.setVolume(0);
        this.updateVolumeUI(0);
      } else {
        Player.setVolume(0.8);
        this.updateVolumeUI(0.8);
      }
    });
    
    // 监听播放器事件
    Player.on('play', (song) => {
      this.onPlay(song);
    });
    
    Player.on('pause', () => {
      this.onPause();
    });
    
    Player.on('timeupdate', (data) => {
      this.onTimeUpdate(data);
    });
    
    Player.on('modechange', (mode) => {
      this.updatePlayModeUI(mode);
    });
  },
  
  /**
   * 搜索音乐
   */
  async search(keyword) {
    console.log('Searching for:', keyword);
    this.switchView('search');
    
    const searchSubtitle = document.getElementById('searchSubtitle');
    const searchResults = document.getElementById('searchResults');
    
    searchSubtitle.textContent = `搜索"${keyword}"中...`;
    searchResults.innerHTML = '<div class="spinner-lg" style="margin: 2rem auto;"></div>';
    
    try {
      console.log('Calling API.aggregateSearch...');
      const result = await API.aggregateSearch(keyword);
      if (result.data && result.data.results) {
        const songs = result.data.results;
        searchSubtitle.textContent = `找到 ${songs.length} 首歌曲`;
        this.renderSongList(searchResults, songs);
      } else {
        searchResults.innerHTML = '<div class="empty-state"><div class="empty-state-title">未找到相关歌曲</div></div>';
      }
    } catch (error) {
      console.error('Search error:', error);
      searchResults.innerHTML = '<div class="empty-state"><div class="empty-state-title">搜索失败</div><div class="empty-state-description">请稍后重试</div></div>';
    }
  },
  
  /**
   * 切换视图
   */
  switchView(view) {
    this.currentView = view;
    
    // 隐藏所有视图
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    
    // 显示目标视图
    const targetView = document.getElementById(`${view}View`);
    if (targetView) {
      targetView.classList.remove('hidden');
    }
    
    // 加载视图数据
    switch (view) {
      case 'favorites':
        this.loadFavorites();
        break;
      case 'history':
        this.loadHistory();
        break;
    }
  },
  
  /**
   * 加载排行榜
   */
  async loadTopLists() {
    const grid = document.getElementById('toplistsGrid');
    
    try {
      // 加载网易云排行榜
      const result = await API.getTopLists('netease');
      
      if (result.data && result.data.list) {
        const toplists = result.data.list.slice(0, 6); // 取前 6 个
        grid.innerHTML = toplists.map(toplist => `
          <div class="card card-glass hover-lift" style="cursor: pointer;" onclick="App.loadToplistSongs('netease', '${toplist.id}', '${toplist.name}')">
            <div class="card-header">
              <h3 class="card-title">${toplist.name || '排行榜'}</h3>
            </div>
            <div class="card-body">
              <p class="text-sm text-secondary">${toplist.updateFrequency || '定期更新'}</p>
              <div class="flex gap-sm mt-md">
                <span class="badge badge-primary">网易云</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Failed to load toplists:', error);
      grid.innerHTML = '<div class="empty-state"><div class="empty-state-title">加载失败</div></div>';
    }
  },
  
  /**
   * 加载排行榜歌曲
   */
  async loadToplistSongs(source, id, name) {
    console.log('Loading toplist:', source, id);
    
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="content-header">
        <h1 class="content-title">${name}</h1>
        <p class="content-subtitle">来自${source === 'netease' ? '网易云音乐' : source}</p>
      </div>
      <div class="content-body">
        <div class="spinner-lg" style="margin: 2rem auto;"></div>
      </div>
    `;
    
    try {
      const result = await API.getToplistSongs(source, id);
      
      if (result.data && result.data.list) {
        const songs = result.data.list.map(song => ({
          ...song,
          platform: source
        }));
        
        content.innerHTML = `
          <div class="content-header">
            <h1 class="content-title">${name}</h1>
            <p class="content-subtitle">共 ${songs.length} 首歌曲</p>
          </div>
          <div class="content-body">
            <button class="btn btn-primary mb-lg" onclick="App.playToplistSongs()">
              <span>▶️</span>
              <span>播放全部</span>
            </button>
            <div class="song-list" id="toplistSongs"></div>
          </div>
        `;
        
        // 保存到临时变量
        this.tempSongs = songs;
        
        const songList = document.getElementById('toplistSongs');
        this.renderSongList(songList, songs);
      }
    } catch (error) {
      console.error('Failed to load toplist songs:', error);
    }
  },
  
  /**
   * 播放排行榜全部歌曲
   */
  playToplistSongs() {
    if (this.tempSongs && this.tempSongs.length > 0) {
      Player.playPlaylist(this.tempSongs, 0);
    }
  },
  
  /**
   * 渲染歌曲列表
   */
  renderSongList(container, songs) {
    if (songs.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-title">暂无歌曲</div></div>';
      return;
    }
    
    container.innerHTML = songs.map((song, index) => {
      const coverUrl = song.platform && song.id ? API.getPicUrl(song.platform, song.id) : '';
      
      return `
        <div class="song-item" data-index="${index}">
          <img src="${coverUrl}" alt="${song.name}" class="song-cover" onerror="this.src='data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><rect fill=\'%23252541\' width=\'100\' height=\'100\'/></svg>'">
          <div class="song-info">
            <div class="song-title">${song.name || '未知歌曲'}</div>
            <div class="song-artist">${song.artist || '未知歌手'}</div>
          </div>
          <span class="badge">${this.getPlatformName(song.platform)}</span>
          <div class="flex gap-sm">
            <button class="btn-icon-sm" onclick="App.playSong(${index})" title="播放">
              <span class="icon-sm">▶️</span>
            </button>
            <button class="btn-icon-sm" onclick="App.addToPlaylist(${index})" title="添加到歌单">
              <span class="icon-sm">➕</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // 保存当前歌曲列表
    this.currentSongs = songs;
  },
  
  /**
   * 播放歌曲
   */
  playSong(index) {
    if (this.currentSongs && this.currentSongs[index]) {
      Player.playPlaylist(this.currentSongs, index);
    }
  },
  
  /**
   * 播放器播放事件
   */
  async onPlay(song) {
    if (!song) return;
    
    // 更新 UI
    document.getElementById('playerTitle').textContent = song.name || '未知歌曲';
    document.getElementById('playerArtist').textContent = song.artist || '未知歌手';
    document.getElementById('playBtn').innerHTML = '<span class="icon-lg">⏸️</span>';
    
    // 更新封面
    if (song.platform && song.id) {
      const coverUrl = API.getPicUrl(song.platform, song.id);
      document.getElementById('playerCover').src = coverUrl;
    }
    
    // 加载歌词
    await this.loadLyrics(song);
    
    // 更新收藏状态
    await this.updateFavoriteButton();
  },
  
  /**
   * 播放器暂停事件
   */
  onPause() {
    document.getElementById('playBtn').innerHTML = '<span class="icon-lg">▶️</span>';
  },
  
  /**
   * 时间更新事件
   */
  onTimeUpdate(data) {
    const { currentTime, duration } = data;
    
    // 更新时间显示
    document.getElementById('currentTime').textContent = Player.formatTime(currentTime);
    document.getElementById('duration').textContent = Player.formatTime(duration);
    
    // 更新进度条
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressThumb').style.left = `${progress}%`;
    
    // 更新歌词
    this.updateLyrics(currentTime);
  },
  
  /**
   * 加载歌词
   */
  async loadLyrics(song) {
    const lyricsPanel = document.getElementById('lyricsList');
    lyricsPanel.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';
    
    try {
      const lyrics = await Lyrics.load(song.platform, song.id);
      
      if (lyrics.length > 0) {
        lyricsPanel.innerHTML = lyrics.map((line, index) => `
          <div class="lyric-line" data-index="${index}" data-time="${line.time}">
            ${line.text}
          </div>
        `).join('');
        
        // 点击歌词跳转
        document.querySelectorAll('.lyric-line').forEach(line => {
          line.addEventListener('click', () => {
            const time = parseFloat(line.dataset.time);
            Player.seek(time);
          });
        });
      } else {
        lyricsPanel.innerHTML = '<div class="empty-state"><div class="empty-state-title">暂无歌词</div></div>';
      }
    } catch (error) {
      console.error('Failed to load lyrics:', error);
      lyricsPanel.innerHTML = '<div class="empty-state"><div class="empty-state-title">加载歌词失败</div></div>';
    }
  },
  
  /**
   * 更新歌词高亮
   */
  updateLyrics(currentTime) {
    const currentLine = Lyrics.getCurrentLine(currentTime);
    
    document.querySelectorAll('.lyric-line').forEach((line, index) => {
      if (index === currentLine) {
        line.classList.add('active');
        // 滚动到当前歌词
        line.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        line.classList.remove('active');
      }
    });
  },
  
  /**
   * 加载歌单列表
   */
  async loadPlaylists() {
    const playlists = await Storage.getAllPlaylists();
    const container = document.getElementById('playlistList');
    
    // 保留创建按钮
    const createBtn = container.querySelector('#createPlaylistBtn');
    container.innerHTML = '';
    container.appendChild(createBtn);
    
    playlists.forEach(playlist => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.innerHTML = `
        <span class="playlist-item-name">${playlist.name}</span>
        <span class="playlist-item-count">${playlist.songCount || 0}</span>
      `;
      item.addEventListener('click', () => {
        this.loadPlaylistDetail(playlist.id);
      });
      container.appendChild(item);
    });
  },
  
  /**
   * 创建歌单
   */
  async createPlaylist() {
    const name = prompt('请输入歌单名称:');
    if (!name) return;
    
    try {
      await Storage.createPlaylist(name.trim());
      await this.loadPlaylists();
    } catch (error) {
      console.error('Failed to create playlist:', error);
      alert('创建歌单失败');
    }
  },
  
  /**
   * 加载歌单详情
   */
  async loadPlaylistDetail(playlistId) {
    this.currentPlaylist = playlistId;
    this.switchView('playlistDetail');
    
    const playlist = await Storage.getPlaylist(playlistId);
    const songs = await Storage.getPlaylistSongs(playlistId);
    
    document.getElementById('playlistDetailTitle').textContent = playlist.name;
    document.getElementById('playlistDetailSubtitle').textContent = `共 ${songs.length} 首歌曲`;
    
    const container = document.getElementById('playlistSongs');
    this.renderSongList(container, songs);
  },
  
  /**
   * 播放全部歌曲
   */
  playAllSongs() {
    if (this.currentSongs && this.currentSongs.length > 0) {
      Player.playPlaylist(this.currentSongs, 0);
    }
  },
  
  /**
   * 添加歌曲到歌单
   */
  async addToPlaylist(index) {
    const song = this.currentSongs[index];
    if (!song) return;
    
    const playlists = await Storage.getAllPlaylists();
    if (playlists.length === 0) {
      alert('请先创建歌单');
      return;
    }
    
    // 简单实现：添加到第一个歌单
    try {
      await Storage.addSongToPlaylist(playlists[0].id, song);
      alert('已添加到歌单');
    } catch (error) {
      console.error('Failed to add song:', error);
      alert('添加失败');
    }
  },
  
  /**
   * 删除当前歌单
   */
  async deleteCurrentPlaylist() {
    if (!this.currentPlaylist) return;
    
    if (confirm('确定要删除此歌单吗？')) {
      try {
        await Storage.deletePlaylist(this.currentPlaylist);
        await this.loadPlaylists();
        this.switchView('discover');
      } catch (error) {
        console.error('Failed to delete playlist:', error);
        alert('删除失败');
      }
    }
  },
  
  /**
   * 加载收藏
   */
  async loadFavorites() {
    const favorites = await Storage.getAllFavorites();
    const container = document.getElementById('favoritesList');
    this.renderSongList(container, favorites);
  },
  
  /**
   * 加载历史
   */
  async loadHistory() {
    const history = await Storage.getHistory();
    const container = document.getElementById('historyList');
    this.renderSongList(container, history);
  },
  
  /**
   * 切换收藏
   */
  async toggleFavorite() {
    const song = Player.currentSong;
    if (!song) return;
    
    const isFav = await Storage.isFavorite(song.platform, song.id);
    
    try {
      if (isFav) {
        await Storage.removeFromFavorites(song.platform, song.id);
      } else {
        await Storage.addToFavorites(song);
      }
      await this.updateFavoriteButton();
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  },
  
  /**
   * 更新收藏按钮
   */
  async updateFavoriteButton() {
    const song = Player.currentSong;
    if (!song) return;
    
    const isFav = await Storage.isFavorite(song.platform, song.id);
    const btn = document.getElementById('favoriteBtn');
    btn.innerHTML = isFav ? '<span class="icon-sm">❤️</span>' : '<span class="icon-sm">🤍</span>';
  },
  
  /**
   * 更新音量 UI
   */
  updateVolumeUI(volume) {
    const percent = volume * 100;
    document.getElementById('volumeFill').style.width = `${percent}%`;
    document.getElementById('volumeThumb').style.left = `${percent}%`;
    
    const icon = document.getElementById('volumeIcon');
    if (volume === 0) {
      icon.textContent = '🔇';
    } else if (volume < 0.5) {
      icon.textContent = '🔉';
    } else {
      icon.textContent = '🔊';
    }
  },
  
  /**
   * 更新播放模式 UI
   */
  updatePlayModeUI(mode) {
    const btn = document.getElementById('repeatBtn');
    const icons = {
      'sequence': '➡️',
      'loop': '🔁',
      'random': '🔀',
      'single': '🔂'
    };
    btn.innerHTML = `<span class="icon-sm">${icons[mode] || '🔁'}</span>`;
  },
  
  /**
   * 获取平台名称
   */
  getPlatformName(platform) {
    const names = {
      'netease': '网易云',
      'kuwo': '酷我',
      'qq': 'QQ音乐'
    };
    return names[platform] || platform;
  },
  
  /**
   * 加载主题
   */
  loadTheme() {
    const theme = Storage.getSetting('theme', 'dark');
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.getElementById('themeToggle').innerHTML = '<span class="icon">☀️</span>';
    }
  },
  
  /**
   * 切换主题
   */
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    Storage.saveSetting('theme', newTheme);
    
    const btn = document.getElementById('themeToggle');
    btn.innerHTML = newTheme === 'light' ? '<span class="icon">☀️</span>' : '<span class="icon">🌙</span>';
  }
};

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
