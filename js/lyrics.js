/**
 * Open Music - Lyrics Module
 * 歌词解析与同步
 */

const Lyrics = {
  lyrics: [],
  currentLine: -1,
  
  /**
   * 解析 LRC 格式歌词
   * @param {string} lrcText - LRC 格式歌词文本
   * @returns {Array} 解析后的歌词数组
   */
  parse(lrcText) {
    if (!lrcText || typeof lrcText !== 'string') {
      return [];
    }
    
    const lines = lrcText.split('\n');
    const lyrics = [];
    
    // LRC 时间标签正则: [mm:ss.xx] 或 [mm:ss.xxx]
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
    
    lines.forEach(line => {
      const matches = [...line.matchAll(timeRegex)];
      
      if (matches.length > 0) {
        // 提取歌词文本（移除所有时间标签）
        const text = line.replace(timeRegex, '').trim();
        
        // 一行可能有多个时间标签
        matches.forEach(match => {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
          
          const time = minutes * 60 + seconds + milliseconds / 1000;
          
          if (text) {
            lyrics.push({ time, text });
          }
        });
      }
    });
    
    // 按时间排序
    lyrics.sort((a, b) => a.time - b.time);
    
    this.lyrics = lyrics;
    this.currentLine = -1;
    
    return lyrics;
  },
  
  /**
   * 根据当前播放时间获取应该显示的歌词行
   * @param {number} currentTime - 当前播放时间（秒）
   * @returns {number} 当前歌词行索引
   */
  getCurrentLine(currentTime) {
    if (this.lyrics.length === 0) {
      return -1;
    }
    
    // 从后往前查找第一个时间小于等于当前时间的歌词
    for (let i = this.lyrics.length - 1; i >= 0; i--) {
      if (this.lyrics[i].time <= currentTime) {
        this.currentLine = i;
        return i;
      }
    }
    
    return -1;
  },
  
  /**
   * 获取当前歌词文本
   * @param {number} currentTime - 当前播放时间（秒）
   * @returns {string} 当前歌词文本
   */
  getCurrentText(currentTime) {
    const lineIndex = this.getCurrentLine(currentTime);
    if (lineIndex >= 0 && lineIndex < this.lyrics.length) {
      return this.lyrics[lineIndex].text;
    }
    return '';
  },
  
  /**
   * 获取所有歌词
   * @returns {Array} 所有歌词
   */
  getAllLyrics() {
    return this.lyrics;
  },
  
  /**
   * 清空歌词
   */
  clear() {
    this.lyrics = [];
    this.currentLine = -1;
  },
  
  /**
   * 从 API 加载歌词
   * @param {string} source - 平台标识
   * @param {string} id - 歌曲 ID
   * @returns {Promise<Array>} 解析后的歌词数组
   */
  async load(source, id) {
    try {
      const lrcText = await API.getLyrics(source, id);
      return this.parse(lrcText);
    } catch (error) {
      console.error('Failed to load lyrics:', error);
      this.clear();
      return [];
    }
  },
  
  /**
   * 格式化时间为 LRC 格式
   * @param {number} time - 时间（秒）
   * @returns {string} LRC 格式时间 [mm:ss.xx]
   */
  formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    
    return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;
  },
  
  /**
   * 将歌词数组转换为 LRC 格式文本
   * @returns {string} LRC 格式文本
   */
  toLRC() {
    return this.lyrics
      .map(line => `${this.formatTime(line.time)}${line.text}`)
      .join('\n');
  },
  
  /**
   * 搜索歌词
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 包含关键词的歌词行
   */
  search(keyword) {
    if (!keyword) return [];
    
    const lowerKeyword = keyword.toLowerCase();
    return this.lyrics.filter(line => 
      line.text.toLowerCase().includes(lowerKeyword)
    );
  }
};

// 导出 Lyrics 模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Lyrics;
}
