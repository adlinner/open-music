/**
 * Open Music - Player Module
 * 音频播放器核心逻辑
 */

const Player = {
  audio: null,
  currentSong: null,
  playlist: [],
  currentIndex: 0,
  isPlaying: false,
  volume: 0.8,
  
  // 播放模式
  MODE: {
    SEQUENCE: 'sequence',    // 顺序播放
    LOOP: 'loop',            // 列表循环
    RANDOM: 'random',        // 随机播放
    SINGLE: 'single'         // 单曲循环
  },
  
  playMode: 'sequence',
  
  // 音质优先级（降级顺序）
  QUALITY_PRIORITY: [
    API.QUALITY.HIRES,
    API.QUALITY.LOSSLESS,
    API.QUALITY.HIGH,
    API.QUALITY.STANDARD
  ],
  
  currentQuality: API.QUALITY.HIGH,
  
  // 事件监听器
  listeners: {
    play: [],
    pause: [],
    ended: [],
    timeupdate: [],
    volumechange: [],
    error: [],
    modechange: []
  },
  
  /**
   * 初始化播放器
   */
  init() {
    this.audio = new Audio();
    this.audio.volume = this.volume;
    
    // 从本地存储恢复设置
    const savedVolume = Storage.getSetting('volume');
    if (savedVolume !== null) {
      this.setVolume(savedVolume);
    }
    
    const savedMode = Storage.getSetting('playMode');
    if (savedMode) {
      this.playMode = savedMode;
    }
    
    const savedQuality = Storage.getSetting('audioQuality');
    if (savedQuality) {
      this.currentQuality = savedQuality;
    }
    
    // 绑定音频事件
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.emit('play', this.currentSong);
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.emit('pause', this.currentSong);
    });
    
    this.audio.addEventListener('ended', () => {
      this.handleEnded();
    });
    
    this.audio.addEventListener('timeupdate', () => {
      this.emit('timeupdate', {
        currentTime: this.audio.currentTime,
        duration: this.audio.duration
      });
    });
    
    this.audio.addEventListener('volumechange', () => {
      this.emit('volumechange', this.audio.volume);
    });
    
    this.audio.addEventListener('error', (e) => {
      console.error('Audio Error:', e);
      this.emit('error', e);
      // 尝试降级音质
      this.tryFallbackQuality();
    });
    
    console.log('Player initialized');
  },
  
  /**
   * 播放歌曲
   */
  async play(song) {
    if (!song) {
      if (this.audio.paused && this.currentSong) {
        this.audio.play();
      }
      return;
    }
    
    this.currentSong = song;
    
    // 获取音乐 URL
    const url = API.getSongUrl(song.platform, song.id, this.currentQuality);
    
    this.audio.src = url;
    
    try {
      await this.audio.play();
      
      // 添加到播放历史
      Storage.addToHistory(song);
    } catch (error) {
      console.error('Play error:', error);
      this.emit('error', error);
    }
  },
  
  /**
   * 暂停播放
   */
  pause() {
    this.audio.pause();
  },
  
  /**
   * 切换播放/暂停
   */
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },
  
  /**
   * 播放列表
   */
  playPlaylist(songs, startIndex = 0) {
    this.playlist = songs;
    this.currentIndex = startIndex;
    
    if (songs.length > 0) {
      this.play(songs[startIndex]);
    }
  },
  
  /**
   * 上一曲
   */
  previous() {
    if (this.playlist.length === 0) return;
    
    if (this.playMode === this.MODE.RANDOM) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    }
    
    this.play(this.playlist[this.currentIndex]);
  },
  
  /**
   * 下一曲
   */
  next() {
    if (this.playlist.length === 0) return;
    
    if (this.playMode === this.MODE.RANDOM) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    
    this.play(this.playlist[this.currentIndex]);
  },
  
  /**
   * 处理播放结束
   */
  handleEnded() {
    this.emit('ended', this.currentSong);
    
    switch (this.playMode) {
      case this.MODE.SINGLE:
        // 单曲循环
        this.play(this.currentSong);
        break;
        
      case this.MODE.LOOP:
      case this.MODE.SEQUENCE:
        // 列表循环或顺序播放
        if (this.currentIndex < this.playlist.length - 1 || this.playMode === this.MODE.LOOP) {
          this.next();
        }
        break;
        
      case this.MODE.RANDOM:
        // 随机播放
        this.next();
        break;
    }
  },
  
  /**
   * 设置播放位置
   */
  seek(time) {
    this.audio.currentTime = time;
  },
  
  /**
   * 设置音量
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
    Storage.saveSetting('volume', this.volume);
  },
  
  /**
   * 设置播放模式
   */
  setPlayMode(mode) {
    if (Object.values(this.MODE).includes(mode)) {
      this.playMode = mode;
      Storage.saveSetting('playMode', mode);
      this.emit('modechange', mode);
    }
  },
  
  /**
   * 切换播放模式
   */
  togglePlayMode() {
    const modes = Object.values(this.MODE);
    const currentIndex = modes.indexOf(this.playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setPlayMode(modes[nextIndex]);
  },
  
  /**
   * 设置音质
   */
  setQuality(quality) {
    this.currentQuality = quality;
    Storage.saveSetting('audioQuality', quality);
    
    // 如果正在播放，重新加载
    if (this.currentSong && this.isPlaying) {
      const currentTime = this.audio.currentTime;
      this.play(this.currentSong).then(() => {
        this.seek(currentTime);
      });
    }
  },
  
  /**
   * 尝试降级音质
   */
  async tryFallbackQuality() {
    const currentPriorityIndex = this.QUALITY_PRIORITY.indexOf(this.currentQuality);
    
    if (currentPriorityIndex < this.QUALITY_PRIORITY.length - 1) {
      // 尝试下一个音质级别
      this.currentQuality = this.QUALITY_PRIORITY[currentPriorityIndex + 1];
      console.log('Falling back to quality:', this.currentQuality);
      
      if (this.currentSong) {
        const currentTime = this.audio.currentTime;
        await this.play(this.currentSong);
        this.seek(currentTime);
      }
    }
  },
  
  /**
   * 获取当前播放时间
   */
  getCurrentTime() {
    return this.audio.currentTime || 0;
  },
  
  /**
   * 获取总时长
   */
  getDuration() {
    return this.audio.duration || 0;
  },
  
  /**
   * 获取播放进度（0-1）
   */
  getProgress() {
    const duration = this.getDuration();
    return duration > 0 ? this.getCurrentTime() / duration : 0;
  },
  
  /**
   * 格式化时间
   */
  formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  /**
   * 事件监听
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  },
  
  /**
   * 移除监听
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  },
  
  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
};

// 导出 Player 模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}
